# DEMO.md — judge path and receipts

Everything below is either reproducible from a fresh clone right now, or explicitly marked **pending** / **not
yet run** — no row claims a device result that has not happened. There is no demo flag, no mock mode, no client-side ad counter anywhere.

## 1. Reproduce from a fresh clone (no credentials)

```bash
git clone https://github.com/edycutjong/nanti && cd nanti
npm install --legacy-peer-deps
npm test && npm run bench && npm run verify:offline && npm run ablation
npx tsx bin/surat.ts demo 1 > /tmp/letter1.html && open /tmp/letter1.html
```

Expected (re-run 2026-09-26, Apple M-series):

```
Tests  79 passed (79)
nanti bench — 8 templates × 1000 renders
  izin-kerja  2109 bytes  p50 2 µs  p95 2 µs   …   PASS (golden 8/8)
  ledger: 200,000 transitions, 30 ns each
ablation: 0 client-side settle increments in src/ (must be 0)
```

## 2. The judge path on a device (dev build, < 3 minutes)

1. Install (`npx expo run:android` with `.env` filled). Home shows eight tiles and no pill.
2. **Surat Izin Tidak Masuk Kerja** → the five fields (city and date already filled) → the paper preview updates on every keystroke → **Buat PDF** → the share sheet opens with `Surat-Izin-Kerja-<name>-<date>.pdf`. _Nothing about an ad has appeared yet._
3. Back on Home: the amber pill **`Tab: 1 iklan · bayar nanti`** slides in.
4. Tap any tile → the Settle sheet. **Tonton 1 iklan** → the rewarded ad plays → _memverifikasi…_ → the counter ticks `ADS 0 → 1`, the pill turns green for 2 s and disappears. (Requires a **release** build — only release builds request the real `settle_rewarded` unit with SSV → RevenueCat, on a device registered as an AdMob test device. A dev build always uses Google's test unit, where this step correctly ends in _Verifikasi gagal_ and the tab stays.)
5. Make a second letter (Surat Kuasa — visibly different structure). Pill again. This time tap **Nanti Pro** → the RevenueCat paywall at placement `tab_locked` → start the 7-day trial (Test Store: instant; **requires the products, offering and paywall, which are not yet created in the dashboard**) → the pill is replaced by a violet **Pro** chip and never returns.
6. Settings → **Bukti RevenueCat**: live `ADS` balance, `pro` entitlement, app user id, the last 5 settles with `verify Δ` and `balance Δ` in seconds. **Restore purchases** and the language override (auto / Indonesia / English) are here too.

## 3. Receipts

| Receipt                                                                                                                    | Status                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 79 tests · bench · verify:offline · ablation                                                                               | ✅ section 1                                                                                                                                                                                                       |
| Signed release AAB (`bundleRelease`, upload key in `~/.config/nanti/`, signer = keystore, not debug)                       | ✅ 72 MB, rebuilt 2026-09-17 — Play key (`goog_`) and the real `settle_rewarded` unit inlined, upload-key signed, `EXTERNAL_STORAGE` blocked; `npm run verify:artifact` PASS. The AAB itself stays out of the repo |
| Metro bundle carries every reward/ad/paywall call + the templates                                                          | ✅ `npm run bundle:check` (3.5 MB Hermes bytecode, 2026-09-16)                                                                                                                                                     |
| Native debug APK `dev.edycu.nanti` assembles with RevenueCat, Google Mobile Ads (RewardedAd), SQLite and Print in the dex  | ✅ `expo prebuild` + `gradlew assembleDebug`, 2026-09-16 — four attempts; see `plugins/withKotlinMetadataCheck.js`                                                                                                 |
| **G1 spike** — 3/3 verified settles with `ADS +1 < 60 s`, RC sandbox rows, Customer History `VIRTUAL_CURRENCY_TRANSACTION` | **not yet run** — `docs/SPIKE.md` still reads `RESULT: not yet run`; the original target (2026-09-16/18) has passed. The project stays CONDITIONAL on this.                                                        |
| `docs/SETTLE-LOG.md` — N ≥ 20 real settles, p50/p95 as measured                                                            | **pending — needs G1 first** (`npm run settle-log`); no rows exist                                                                                                                                                 |
| Test Store Pro purchase → `entitlements.active.pro`                                                                        | **pending — not yet run on a device**                                                                                                                                                                              |
| Play Billing sandbox purchase (license tester)                                                                             | **pending — not yet run**                                                                                                                                                                                          |
| Play production submission                                                                                                 | **pending — production upload in progress, not live** (as of 2026-09-26)                                                                                                                                           |
| Demo video (< 2 min, real device, share sheet cropped, ad creative blurred)                                                | **not recorded** — no video exists yet; the link lands here and in `JUDGE.md` when it does                                                                                                                         |

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
