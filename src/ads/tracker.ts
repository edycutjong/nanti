/**
 * 6–10. Purchases.adTracker.* — ad lifecycle + impression-level revenue into
 * RevenueCat, keyed by the same impressionId the reward token was minted
 * for. This is what puts the settled ad next to the subscription in one LTV.
 */
import Purchases, { AdFormat, AdMediatorName, AdRevenuePrecision } from 'react-native-purchases';

export const PLACEMENT_SETTLE = 'tab_settle_rewarded';

export interface AdRef {
  adUnitId: string;
  impressionId: string;
}

const base = (ref: AdRef) => ({
  mediatorName: AdMediatorName.adMob,
  adFormat: AdFormat.rewarded,
  adUnitId: ref.adUnitId,
  impressionId: ref.impressionId,
  placement: PLACEMENT_SETTLE,
});

const swallow = (p: Promise<void>) => p.catch(() => {});

export const track = {
  loaded: (ref: AdRef) => swallow(Purchases.adTracker.trackAdLoaded(base(ref))),
  displayed: (ref: AdRef) => swallow(Purchases.adTracker.trackAdDisplayed(base(ref))),
  opened: (ref: AdRef) => swallow(Purchases.adTracker.trackAdOpened(base(ref))),
  revenue: (ref: AdRef, value: number, currency: string, precision: string) =>
    swallow(
      Purchases.adTracker.trackAdRevenue({
        ...base(ref),
        revenueMicros: Math.round(value * 1e6),
        currency,
        precision: precision || AdRevenuePrecision.unknown,
      }),
    ),
  failedToLoad: (ref: AdRef, code?: number) =>
    swallow(
      Purchases.adTracker.trackAdFailedToLoad({
        mediatorName: AdMediatorName.adMob,
        adFormat: AdFormat.rewarded,
        adUnitId: ref.adUnitId,
        mediatorErrorCode: code ?? null,
        placement: PLACEMENT_SETTLE,
      }),
    ),
};

/** Maps AdMob's numeric precision to RevenueCat's strings. */
export function precisionOf(p: number | string | undefined): string {
  const map: Record<string, string> = {
    '0': AdRevenuePrecision.unknown,
    '1': AdRevenuePrecision.estimated,
    '2': AdRevenuePrecision.publisherDefined,
    '3': AdRevenuePrecision.exact,
  };
  if (p === undefined) return AdRevenuePrecision.unknown;
  return map[String(p)] ?? String(p);
}
