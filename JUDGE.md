# For the judge — Nanti in 30 seconds

**The letter now, the ad later: a correctly formatted Indonesian formal letter as a PDF, delivered first, then one rewarded ad on a visible tab that only RevenueCat's server can mark as paid.**

> ⚠️ **Conditional project.** The settle round-trip (ad → AdMob server-side verification → RevenueCat → `ADS +1`) is fully built and in the bundle, but has **not yet run on a device**. `docs/SPIKE.md` is the protocol and carries `RESULT: not yet run`. Everything below that depends on it is marked pending.

## The 30-second path (no setup, no keys)

1. Install the app — _there is no live Play listing yet (production upload in progress as of 2026-09-26); its link lands here when it is published. Until then the path below runs on a dev build — `DEMO.md` §2._
2. **Surat Izin Tidak Masuk Kerja** → five fields (city and date are already filled) → the paper preview updates as you type → **Buat PDF** → the share sheet opens with a real file name. _No ad has appeared._
3. Back on Home: the amber pill **`Tab: 1 iklan · bayar nanti`**.
4. Tap any tile → the Settle sheet. **Tonton 1 iklan** → ad → _memverifikasi…_ → `ADS 0 → 1`, the pill turns green once and disappears (release build only: a dev build always serves Google's test unit, where verification correctly fails and the tab stays). Or **Nanti Pro** → the RevenueCat paywall → violet **Pro** chip, no tab ever again.
5. Settings → **Bukti RevenueCat**: live `ADS` balance, `pro` entitlement, app user id, last 5 settles with Δ timings.

Without a phone: `npm install --legacy-peer-deps && npx tsx bin/surat.ts demo 1 > letter.html` renders the exact HTML the PDF is printed from.

## Receipts

|                                                      | Value                                                                                                                                                                 | How to verify                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Tests                                                | **81**, < 2 s, no device, no key                                                                                                                                      | `npm test`                                    |
| Exhaustive verification                              | **70,602** ledger transitions — debt ∈ {0,1}, never lowered by a client event; **299,592** settle-machine paths — `settled` reached only via `verified`; 0 violations | `tests/exhaustive.test.ts`                    |
| Self-ablation                                        | **0** client-side settle increments in `src/`                                                                                                                         | `npm run ablation` · `tests/boundary.test.ts` |
| Templates                                            | 8, byte-identical to golden files; p95 ≤ 4 µs per render                                                                                                              | `npm test` · `npm run bench`                  |
| Coverage of the pure modules                         | 100 % statements/branches/functions/lines                                                                                                                             | `npm run test:coverage`                       |
| RevenueCat methods                                   | 15 across `src/rc/client.ts`, `src/ads/settle.ts`, `src/ads/tracker.ts`, `src/paywall/open.ts`                                                                        | grep                                          |
| Native build                                         | debug APK `dev.edycu.nanti` — RevenueCat, Google Mobile Ads, SQLite, Print in the dex                                                                                 | CI Stage 4 · `DEMO.md`                        |
| **G1 spike (3/3 verified settles, `ADS +1 < 60 s`)** | **pending** — `docs/SPIKE.md`                                                                                                                                         | —                                             |
| **Settle-to-balance latency, N ≥ 20**                | **pending** — `docs/SETTLE-LOG.md` via `npm run settle-log`                                                                                                           | —                                             |

## Reproduce (the real path)

```bash
git clone https://github.com/edycutjong/nanti && cd nanti
npm install --legacy-peer-deps
npm test && npm run bench && npm run verify:offline && npm run ablation
# the app: cp .env.example .env   # RevenueCat Test Store key · AdMob app id (dev builds always use Google's test ad unit)
npx expo prebuild --platform android && npx expo run:android
```

No offline / mock / demo flag exists. A dev build always requests Google's test ad unit (AdMob policy; the real unit is release-only). On it the ad plays but verification **correctly fails** and the tab stays — the app never pretends a grant happened. `verify:offline` checks only the offline-capable parts and says so.

## Honest limitations

- **The judged round-trip is unverified on a device.** It follows RevenueCat's own React Native sample and the published typings; whether AdMob's SSV callback completes inside 60 s depends on an approved AdMob account, RevenueCat Ads beta access and a registered test device — none of which live in this repo.
- RevenueCat Ads on React Native is **beta** (`@beta` on every reward method). Versions are pinned; `Dependabot` ignores them.
- The Pro products (`nanti_pro_monthly` with a 7-day trial, `nanti_pro_lifetime`), offerings, the `tab_locked` placement and the paywall are configured in code but **not yet created** in the RevenueCat / Play dashboards; until they are, the paywall has nothing to sell.
- A brand-new AdMob app has limited fill before its Play listing is approved, so an early install may only ever see the _Lanjut dulu_ grace path. The receipts (SPIKE.md, SETTLE-LOG.md) carry the proof in that case.
- Native build needs `-Xskip-metadata-version-check` (Kotlin 2.1 toolchain vs. Kotlin-2.3-built `play-services-ads 25.4.0`). Documented in `plugins/withKotlinMetadataCheck.js`; drop when Expo's Kotlin catches up.

## Links

Repo · Play listing (not published yet) · Demo video (not recorded yet) · [Landing + privacy](https://edycutjong.github.io/nanti/) · [DEMO.md](DEMO.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [docs/LEDGER.md](docs/LEDGER.md) · [docs/SPIKE.md](docs/SPIKE.md)
