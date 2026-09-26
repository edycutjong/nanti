/**
 * The settle round-trip — the judged capability, end to end, in one file.
 *
 *   impressionId = uuid()
 *   4. token = Purchases.generateRewardVerificationToken(impressionId)
 *      RewardedAd.createForAdRequest(unit, { serverSideVerificationOptions: { userId, customData } })
 *      LOADED → adTracker.trackAdLoaded → show()
 *      OPENED → trackAdDisplayed · PAID → trackAdRevenue · ERROR → trackAdFailedToLoad
 *      EARNED_REWARD (t0)
 *   5. result = Purchases.pollRewardVerification(token.clientTransactionId, metadata)  (t1)
 *      result.failed || !result.reward → outcome 'failed' — NOTHING ELSE HAPPENS
 *   2. balance = getVirtualCurrencies().all.ADS.balance  (t2) — the tab clears from this read
 *
 * Forbidden (spec §4, docs): granting on EARNED_REWARD, granting on CLOSED,
 * counting locally, a "temporary" paid flag. None of those exist here; the
 * settle state machine (settleState.ts) cannot reach `settled` without a
 * `verified` event, and that event is emitted only below, after the poll.
 */
import Purchases, {
  AdFormat,
  AdMediatorName,
  type RewardVerificationResult,
} from 'react-native-purchases';
import * as Crypto from 'expo-crypto';
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { readAdsBalance } from '../rc/client';
import { initAds } from './init';
import { next, outcomeOf, type SettleEvent, type SettleState } from './settleState';
import { PLACEMENT_SETTLE, precisionOf, track } from './tracker';

/**
 * AdMob policy: development builds request Google's test rewarded unit, always —
 * never the live unit, so a developer's own taps can never count as invalid
 * traffic. Release builds (`__DEV__ === false`) use the real `settle_rewarded`
 * unit inlined from the env at build time (`verify:artifact` fails a release
 * artifact that carries the sample unit). SSV cannot be enabled on Google's
 * test unit, so on it a verification (correctly) comes back `failed` and the
 * tab stays — the app never pretends otherwise.
 */
export function rewardedUnitId(
  dev: boolean = __DEV__,
  envUnit: string | undefined = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT,
): { id: string; isSample: boolean } {
  if (dev || !envUnit) return { id: TestIds.REWARDED, isSample: true };
  return { id: envUnit, isSample: false };
}

export interface SettleLogRow {
  impressionId: string;
  tEarned: number;
  tVerified: number | null;
  tBalance: number | null;
  balanceBefore: number;
  balanceAfter: number | null;
  outcome: 'verified' | 'failed' | 'no_fill' | 'closed_early';
}

export interface SettleHooks {
  onState(state: SettleState): void;
  /** Called once with the row for settle_log (killer-number receipt). */
  onLog(row: SettleLogRow): void;
}

const LOAD_TIMEOUT_MS = 20_000;

export async function settleOneAd(balanceBefore: number, hooks: SettleHooks): Promise<SettleState> {
  const { id: adUnitId } = rewardedUnitId();
  const impressionId = Crypto.randomUUID();
  const ref = { adUnitId, impressionId };
  let state: SettleState = 'idle';
  const emit = (ev: SettleEvent) => {
    state = next(state, ev);
    hooks.onState(state);
  };
  emit({ type: 'start' });

  // No ad request before the Mobile Ads SDK has initialised (memoised; App.tsx started it).
  await initAds();

  // 4. bind the impression to this customer before the ad is even requested. If the token
  // cannot be minted (offline, Ads beta not enabled) or the request cannot be built, no ad can
  // be served: that is no_fill — the grace path — never a stuck spinner or an unhandled rejection.
  let token: Awaited<ReturnType<typeof Purchases.generateRewardVerificationToken>>;
  let ad: RewardedAd;
  try {
    token = await Purchases.generateRewardVerificationToken(impressionId);
    ad = RewardedAd.createForAdRequest(adUnitId, {
      serverSideVerificationOptions: { userId: token.appUserID, customData: token.customData },
    });
  } catch {
    void track.failedToLoad(ref);
    emit({ type: 'load_error' });
    hooks.onLog({
      impressionId,
      tEarned: Date.now(),
      tVerified: null,
      tBalance: null,
      balanceBefore,
      balanceAfter: null,
      outcome: 'no_fill',
    });
    return state;
  }

  let tEarned = 0;
  const finished = new Promise<SettleState>((resolve) => {
    let done = false;
    const finish = (s: SettleState) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      off();
      resolve(s);
    };
    const timer = setTimeout(() => {
      if (state === 'loading') {
        void track.failedToLoad(ref);
        emit({ type: 'load_error' });
        finish(state);
      }
    }, LOAD_TIMEOUT_MS);

    const off = ad.addAdEventsListener(({ type, payload }) => {
      switch (type) {
        case RewardedAdEventType.LOADED:
          void track.loaded(ref);
          emit({ type: 'loaded' });
          ad.show().catch(() => {
            emit({ type: 'load_error' });
            finish(state);
          });
          break;
        case AdEventType.OPENED:
          void track.displayed(ref);
          void track.opened(ref);
          break;
        case AdEventType.PAID: {
          const p = payload as
            { value?: number; currency?: string; precision?: number } | undefined;
          void track.revenue(ref, p?.value ?? 0, p?.currency ?? 'USD', precisionOf(p?.precision));
          break;
        }
        case AdEventType.ERROR: {
          const code = (payload as { code?: string } | undefined)?.code;
          void track.failedToLoad(ref, code ? Number.parseInt(code, 10) || undefined : undefined);
          emit({ type: 'load_error' });
          finish(state);
          break;
        }
        case RewardedAdEventType.EARNED_REWARD:
          tEarned = Date.now();
          emit({ type: 'earned' });
          // 5. the only path to `settled`: RevenueCat verifies the SSV callback
          void verify().then(finish);
          break;
        case AdEventType.CLOSED:
          if (state === 'playing') {
            emit({ type: 'closed' });
            finish(state);
          }
          break;
      }
    });

    try {
      ad.load();
    } catch {
      void track.failedToLoad(ref);
      emit({ type: 'load_error' });
      finish(state);
    }
  });

  async function verify(): Promise<SettleState> {
    let result: RewardVerificationResult;
    try {
      result = await Purchases.pollRewardVerification(token.clientTransactionId, {
        mediatorName: AdMediatorName.adMob,
        adFormat: AdFormat.rewarded,
        adUnitId,
        impressionId,
        placement: PLACEMENT_SETTLE,
      });
    } catch {
      result = { failed: true, moreRewards: [] };
    }
    const tVerified = Date.now();
    if (result.failed || !result.reward || result.reward.type !== 'virtual_currency') {
      emit({ type: 'verify_failed' });
      hooks.onLog({
        impressionId,
        tEarned,
        tVerified,
        tBalance: null,
        balanceBefore,
        balanceAfter: null,
        outcome: 'failed',
      });
      return state;
    }
    // 2. read the balance the server just moved — the SDK invalidated its cache before resolving
    const balanceAfter =
      (await readAdsBalance().catch(() => null)) ?? balanceBefore + result.reward.amount;
    const tBalance = Date.now();
    emit({ type: 'verified' });
    hooks.onLog({
      impressionId,
      tEarned,
      tVerified,
      tBalance,
      balanceBefore,
      balanceAfter,
      outcome: 'verified',
    });
    return state;
  }

  const final = await finished;
  const outcome = outcomeOf(final);
  if (outcome && outcome !== 'verified' && outcome !== 'failed')
    hooks.onLog({
      impressionId,
      tEarned: Date.now(),
      tVerified: null,
      tBalance: null,
      balanceBefore,
      balanceAfter: null,
      outcome,
    });
  return final;
}
