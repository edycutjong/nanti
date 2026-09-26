/**
 * Google Mobile Ads start-up, memoised: UMP consent (EEA/UK) first, then
 * `mobileAds().initialize()`. App.tsx starts it on first render; settle.ts
 * awaits the same promise before it creates or loads a RewardedAd, so no ad
 * request can reach the native SDK before initialisation has completed.
 * Never rejects: a consent or init failure degrades to no fill (the grace
 * path), never to a crash, and never blocks a letter.
 */
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

let started: Promise<void> | null = null;

export function initAds(): Promise<void> {
  if (!started)
    started = (async () => {
      try {
        await AdsConsent.requestInfoUpdate();
        await AdsConsent.gatherConsent();
      } catch {
        /* consent unavailable — ads may no-fill; the tab's grace path covers it */
      }
      try {
        await mobileAds().initialize();
      } catch {
        /* init failed — the next load() reports ERROR → no_fill */
      }
    })();
  return started;
}
