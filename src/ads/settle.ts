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
import { next, outcomeOf, type SettleEvent, type SettleState } from './settleState';
import { PLACEMENT_SETTLE, precisionOf, track } from './tracker';

/**
 * The real rewarded unit `settle_rewarded` from the env. SSV cannot be enabled
 * on Google's sample unit, so with the fallback a verification will (correctly)
 * come back `failed` and the tab stays — the app never pretends otherwise.
 */
export function rewardedUnitId(): { id: string; isSample: boolean } {
  const id = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT ?? '';
  return id ? { id, isSample: false } : { id: TestIds.REWARDED, isSample: true };
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

  // 4. bind the impression to this customer before the ad is even requested
  const token = await Purchases.generateRewardVerificationToken(impressionId);

  const ad = RewardedAd.createForAdRequest(adUnitId, {
    serverSideVerificationOptions: { userId: token.appUserID, customData: token.customData },
  });

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

  ad.load();
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
