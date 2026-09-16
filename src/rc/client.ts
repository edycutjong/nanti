/**
 * RevenueCat — configure, customer info, virtual currency, restore, attributes.
 *
 * The ad-reward calls live in src/ads/settle.ts and the paywall in
 * src/paywall/open.ts; between the three files this is every SDK method
 * the app uses (see ARCHITECTURE.md for the numbered list).
 *
 * The client READS the ADS balance; it never writes it. Grants happen on
 * RevenueCat's server after AdMob's server-side verification callback.
 */
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import type { WriterTier } from '../ledger/tab';

export const ENT_PRO = 'pro';
export const VC_ADS = 'ADS';

/** Public SDK key from the env (sourced from ~/.config/nanti/, never in the tree). */
export function resolveApiKey(): { key: string; store: 'TEST' | 'GOOGLE' } {
  const store = process.env.EXPO_PUBLIC_RC_STORE === 'GOOGLE' ? 'GOOGLE' : 'TEST';
  const key =
    store === 'GOOGLE'
      ? process.env.EXPO_PUBLIC_RC_GOOGLE_KEY
      : process.env.EXPO_PUBLIC_RC_TEST_KEY;
  return { key: key ?? '', store };
}

/** 1. configure — anonymous app user id; there are no accounts. */
export function configurePurchases(): boolean {
  const { key } = resolveApiKey();
  if (!key) return false;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: key });
  return true;
}

/** 13. getCustomerInfo + addCustomerInfoUpdateListener — the `pro` gate. */
export const getCustomerInfo = (): Promise<CustomerInfo> => Purchases.getCustomerInfo();
export function onCustomerInfo(cb: (info: CustomerInfo) => void): () => void {
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}
export const isPro = (info: CustomerInfo | null | undefined): boolean =>
  Boolean(info?.entitlements?.active?.[ENT_PRO]);

/** 2. getVirtualCurrencies — the tab reads the ADS balance from here and nowhere else. */
export async function readAdsBalance({ fresh = false } = {}): Promise<number | null> {
  // 3. invalidateVirtualCurrenciesCache — pull-to-refresh and after a settle.
  if (fresh) await Purchases.invalidateVirtualCurrenciesCache();
  const vc = await Purchases.getVirtualCurrencies();
  const ads = vc.all?.[VC_ADS];
  return typeof ads?.balance === 'number' ? ads.balance : null;
}

/** 14. restorePurchases — Settings. */
export const restore = (): Promise<CustomerInfo> => Purchases.restorePurchases();

/** 15. setAttributes + syncAttributesAndOfferingsIfNeeded — the Targeting inputs, after every export. */
export async function syncWriterAttributes(lettersMade: number, tier: WriterTier): Promise<void> {
  Purchases.setAttributes({ letters_made: String(lettersMade), writer_tier: tier });
  await Purchases.syncAttributesAndOfferingsIfNeeded();
}

export const getAppUserId = (): Promise<string> => Purchases.getAppUserID();
