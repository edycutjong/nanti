# G1 — the RevenueCat Ads on React Native spike

> **RESULT: not yet run.** This project is CONDITIONAL on this spike (see DEMO.md → "What is unfinished").
> The protocol below is what the code is built to execute; the three timestamps and screenshots are filled in
> by the run itself. Nothing in this repository claims the round-trip has completed on a device.

## Pass condition (all three, 3/3 runs)

1. `RewardedAdEventType.EARNED_REWARD` fires on the real `settle_rewarded` unit (test creative, registered test device).
2. RevenueCat **Ads → Sandbox data** shows `loaded` / `displayed` / `revenue` rows carrying our `impressionId`.
3. `Purchases.pollRewardVerification` resolves with `reward.type === "virtual_currency"` and
   `getVirtualCurrencies().all.ADS.balance` reads **+1 within 60 s** of `EARNED_REWARD`; RevenueCat Customer History
   shows `VIRTUAL_CURRENCY_TRANSACTION` with `source: ad_reward`.

## Preconditions (dashboard work, each a STOP if it cannot be completed)

| #   | Precondition                                                                                                      | Evidence                                    |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| P1  | RevenueCat project "Nanti" with a Test Store app; **Ads** page and **Rewards** sub-page visible (beta access)     | `docs/spike/01-ads-page.png`                |
| P2  | AdMob account approved; app "Nanti" (Android, `dev.edycu.nanti`); rewarded unit `settle_rewarded`                 | unit id → `EXPO_PUBLIC_ADMOB_REWARDED_UNIT` |
| P3  | Unit: server-side verification ON, callback `https://api.revenuecat.com/v1/incoming-webhooks/admob-ssv-rewarded`  | `02-ssv.png`                                |
| P4  | AdMob impression-level ad revenue ON                                                                              | `03-ilrd.png`                               |
| P5  | AdMob OAuth-connected to RevenueCat; `settle_rewarded` synced                                                     | `04-admob-sync.png`                         |
| P6  | Virtual currency `ADS`                                                                                            | `05-vc.png`                                 |
| P7  | Rewards rule: `settle_rewarded` → `ADS` × 1                                                                       | `06-reward-rule.png`                        |
| P8  | Entitlement `pro`; products `nanti_pro_monthly` (7-day trial) + `nanti_pro_lifetime`; offering `default`; paywall | `07-offering.png`                           |
| P9  | The test phone registered as an AdMob test device                                                                 | device id noted                             |

## The run

```bash
cp .env.example .env           # real keys + the settle_rewarded unit id
set -a; . ~/.config/nanti/secrets.env; set +a
npx expo prebuild --platform android && npx expo run:android --device
# make one letter → share → tap the pill → "Tonton 1 iklan" ×3
# Settings → Bukti RevenueCat shows the last 5 settles with their Δ timings
adb shell "run-as dev.edycu.nanti cat databases/nanti.db" > /tmp/nanti.db
sqlite3 -json /tmp/nanti.db "select * from settle_log order by t_earned" > /tmp/settle.json
npm run settle-log -- /tmp/settle.json     # → docs/SETTLE-LOG.md
```

## Results

| run | impressionId | t0 EARNED_REWARD | t1 verified | t2 balance +1 | Δ t2−t0 | RC sandbox rows | Customer History |
| --- | ------------ | ---------------- | ----------- | ------------- | ------- | --------------- | ---------------- |
| 1   | —            | —                | —           | —             | —       | —               | —                |
| 2   | —            | —                | —           | —             | —       | —               | —                |
| 3   | —            | —                | —           | —             | —       | —               | —                |

SDK versions: `react-native-purchases` 10.9.1 · `react-native-purchases-ui` 10.9.1 · `react-native-google-mobile-ads` 16.5.0 · Expo 54 / RN 0.81.5.

## Known failure map (from the docs)

| Symptom                                       | Likely cause                                                                   | Fix                               |
| --------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------- |
| no ad loads (`ERROR` no-fill)                 | device not registered as test device / unit just created                       | register device, wait ~1 h, retry |
| `EARNED_REWARD` but `failed: true` every time | SSV off on the unit / wrong callback URL / unit not synced to RC               | P3, P5                            |
| verified but balance unchanged                | Rewards rule missing or wrong currency                                         | P7                                |
| verification reports an app / store mismatch  | dev build on the Test Store key while Ads objects resolve against the Play app | re-run with the Play app's key    |

**Forbidden fixes:** counting `EARNED_REWARD` locally, granting on `CLOSED`, a fake verification against Google's
sample unit, any "temporary" flag that marks the tab paid without a server balance read.
