/**
 * 11 + 12. getCurrentOfferingForPlacement('tab_locked') → RevenueCatUI.presentPaywall.
 *
 * The placement is where the dashboard Targeting rule lands: `writer_tier is
 * any of [heavy]` → offering `heavy` (lifetime first); everyone else →
 * `default` (monthly first, 7-day trial — the judge path). purchasePackage
 * runs inside the paywall — one purchase path, not two.
 */
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export const PLACEMENT_TAB_LOCKED = 'tab_locked';

export async function openProPaywall(): Promise<boolean> {
  const offering = await Purchases.getCurrentOfferingForPlacement(PLACEMENT_TAB_LOCKED);
  const result = await RevenueCatUI.presentPaywall({
    offering: offering ?? undefined,
    displayCloseButton: true,
  });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}
