/**
 * 11 + 12. getCurrentOfferingForPlacement('tab_locked') → RevenueCatUI.presentPaywall.
 *
 * The placement is where the dashboard Targeting rule lands: `writer_tier is
 * any of [heavy]` → offering `heavy` (lifetime first); everyone else →
 * `default` (monthly first, 7-day trial). purchasePackage runs inside the
 * paywall — one purchase path, not two.
 *
 * The placement lookup falls back to the project's current offering, so a
 * `null` here means there is no offering at all (or the products cannot be
 * fetched — the SDK rejects with a configuration error). Then there is nothing
 * to sell: the caller shows "Pro is not available yet" instead of presenting an
 * empty paywall or failing silently.
 */
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export const PLACEMENT_TAB_LOCKED = 'tab_locked';

export type ProOutcome = 'purchased' | 'cancelled' | 'unavailable' | 'error';

/** Maps the paywall result onto what the settle sheet shows. */
export function outcomeOfPaywall(result: PAYWALL_RESULT | string): ProOutcome {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
    case PAYWALL_RESULT.RESTORED:
      return 'purchased';
    case PAYWALL_RESULT.CANCELLED:
      return 'cancelled';
    case PAYWALL_RESULT.NOT_PRESENTED:
      return 'unavailable';
    default:
      return 'error';
  }
}

export async function openProPaywall(): Promise<ProOutcome> {
  let offering;
  try {
    offering = await Purchases.getCurrentOfferingForPlacement(PLACEMENT_TAB_LOCKED);
  } catch {
    return 'unavailable';
  }
  if (!offering || offering.availablePackages.length === 0) return 'unavailable';
  try {
    const result = await RevenueCatUI.presentPaywall({ offering, displayCloseButton: true });
    return outcomeOfPaywall(result);
  } catch {
    return 'error';
  }
}
