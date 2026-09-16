# DEMO.md — judge path and receipts

Everything below is either reproducible from a fresh clone right now, or explicitly marked **pending** with the
date it is due. There is no demo flag, no mock mode, no client-side ad counter anywhere.

## 1. Reproduce from a fresh clone (no credentials)

```bash
git clone https://github.com/edycutjong/nanti && cd nanti
npm install --legacy-peer-deps
npm test && npm run bench && npm run verify:offline && npm run ablation
npx tsx bin/surat.ts demo 1 > /tmp/letter1.html && open /tmp/letter1.html
```

Expected (2026-09-16, Node 22, Apple M-series):

```
Tests  72 passed (72)
nanti bench — 8 templates × 1000 renders
  izin-kerja  2109 bytes  p50 2 µs  p95 2 µs   …   PASS (golden 8/8)
  ledger: 200,000 transitions, 28 ns each
ablation: 0 client-side settle increments in src/ (must be 0)
```

## 2. The judge path on a device (dev build, < 3 minutes)

1. Install (`npx expo run:android` with `.env` filled). Home shows eight tiles and no pill.
2. **Surat Izin Tidak Masuk Kerja** → the five fields (city and date already filled) → the paper preview updates on every keystroke → **Buat PDF** → the share sheet opens with `Surat-Izin-Kerja-<name>-<date>.pdf`. _Nothing about an ad has appeared yet._
3. Back on Home: the amber pill **`Tab: 1 iklan · bayar nanti`** slides in.
4. Tap any tile → the Settle sheet. **Tonton 1 iklan** → the rewarded ad plays → _memverifikasi…_ → the counter ticks `ADS 0 → 1`, the pill turns green for 2 s and disappears. (Requires the real `settle_rewarded` unit with SSV → RevenueCat; on the sample unit this step correctly ends in _Verifikasi gagal_ and the tab stays.)
5. Make a second letter (Surat Kuasa — visibly different structure). Pill again. This time tap **Nanti Pro** → the RevenueCat paywall at placement `tab_locked` → start the 7-day trial (Test Store: instant) → the pill is replaced by a violet **Pro** chip and never returns.
6. Settings → **Bukti RevenueCat**: live `ADS` balance, `pro` entitlement, app user id, the last 5 settles with `verify Δ` and `balance Δ` in seconds. **Restore purchases** and the language override (auto / Indonesia / English) are here too.

## 3. Receipts

| Receipt                                                                                                                    | Status                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 72 tests · bench · verify:offline · ablation                                                                               | ✅ section 1                                                                                                            |
| Metro bundle carries every reward/ad/paywall call + the templates                                                          | ✅ `npm run bundle:check` (3.5 MB Hermes bytecode, 2026-09-16)                                                          |
| Native debug APK `app.nanti.surat` assembles with RevenueCat, Google Mobile Ads (RewardedAd), SQLite and Print in the dex  | ✅ `expo prebuild` + `gradlew assembleDebug`, 2026-09-16 — four attempts; see `plugins/withKotlinMetadataCheck.js`      |
| **G1 spike** — 3/3 verified settles with `ADS +1 < 60 s`, RC sandbox rows, Customer History `VIRTUAL_CURRENCY_TRANSACTION` | **pending — `docs/SPIKE.md`, first attempt 2026-09-16/17, outer bound 2026-09-18.** The project is CONDITIONAL on this. |
| `docs/SETTLE-LOG.md` — N ≥ 20 real settles, p50/p95 as measured                                                            | **pending — build day 5, 2026-09-22** (`npm run settle-log`)                                                            |
| Test Store Pro purchase → `entitlements.active.pro`                                                                        | **pending — day 1**                                                                                                     |
| Play Billing sandbox purchase (license tester)                                                                             | **pending — day 4, 2026-09-21**                                                                                         |
| Play production submission                                                                                                 | **pending — 2026-09-23 (latest 09-24)**                                                                                 |
| Demo video (< 2 min, real device, share sheet cropped, ad creative blurred)                                                | **pending — 2026-09-22/23**                                                                                             |

## 4. The killer number

**Settle-to-balance latency**: `EARNED_REWARD` → `ADS` balance +1 visible, p95 over N ≥ 20 real settles on a physical
phone. The SDK's own poller allows ~10–30 s. **The published number is the measured one, whatever it is** — it is
generated by `scripts/settle-log-export.ts` from the device's `settle_log` table, never typed by hand. No rows exist
yet; nothing above claims a latency.

## 5. What still breaks or is unfinished

- **The settle round-trip has not run on a device.** Everything up to and including `pollRewardVerification` is written against the published typings and the docs' RN sample and is in the Metro bundle; whether the SSV callback completes inside 60 s is exactly the G1 spike, and it depends on an AdMob account approval and RevenueCat Ads beta access that are outside this repo.
- RevenueCat Ads on React Native is **beta**; the reward APIs are marked `@beta` and may change. Versions are pinned.
- A brand-new AdMob app has limited or no fill before the Play listing is approved — early installs may hit the _Lanjut dulu_ grace path and never see an ad. The receipts (SPIKE.md, SETTLE-LOG.md) carry the proof in that case.
- The live preview uses a WebView `zoom` to fit A4 into the card; Android's WebView honours it, but the exact scale on very narrow (< 360 dp) phones is untested.
- `en` locale is chrome-only by design; the letters are always Indonesian.
