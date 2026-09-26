<div align="center">

<img src="docs/assets/icon-512.png" width="96" alt="Nanti" />

# Nanti

**Suratnya sekarang, iklannya nanti.** — _The letter now. The ad later._

<img src="docs/assets/readme-hero-animated.svg" width="100%" alt="Nanti — the letter is delivered first; one ad goes on a visible tab, settled later by RevenueCat." />

[For the judge → JUDGE.md](JUDGE.md) · [live judge page](https://edycutjong.github.io/nanti/judge.html) · [The flow](#-the-one-flow) · [Why the tab cannot lie](#-why-the-tab-cannot-lie) · [RevenueCat integration](#-revenuecat-is-the-engine) · [Run it](#-run-it-without-credentials)

![Expo](https://img.shields.io/badge/Expo_54-000?logo=expo&logoColor=fff) ![React Native](https://img.shields.io/badge/React_Native_0.81-20232a?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=fff) ![RevenueCat](https://img.shields.io/badge/RevenueCat_10.9_+_Ads-f25a5a) ![AdMob](https://img.shields.io/badge/AdMob_SSV-4285F4?logo=google&logoColor=fff) ![tests](https://img.shields.io/badge/tests-73_passing-2ea44f) [![CI](https://github.com/edycutjong/nanti/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/nanti/actions/workflows/ci.yml) [![CodeQL](https://github.com/edycutjong/nanti/actions/workflows/codeql.yml/badge.svg)](https://github.com/edycutjong/nanti/actions/workflows/codeql.yml) [![gitleaks](https://github.com/edycutjong/nanti/actions/workflows/gitleaks.yml/badge.svg)](https://github.com/edycutjong/nanti/actions/workflows/gitleaks.yml) [![Release](https://img.shields.io/github/v/release/edycutjong/nanti)](https://github.com/edycutjong/nanti/releases)

</div>

---

## ✉️ What it is

Indonesian workers, students and parents regularly need a _correctly formatted_ formal letter — surat izin, surat kuasa, surat pernyataan, lamaran, pengunduran diri — on the phone, right now, to send over chat. Every "surat izin" app puts a 30-second ad **between you and the PDF**.

Nanti flips the order. Pick one of eight letters, fill five fields (city and date are auto-filled), tap **Buat PDF** — and the share sheet opens with a properly structured A4 letter. _Then_ one rewarded ad goes on a visible tab: **`Tab: 1 iklan · bayar nanti`**. Settle it whenever you like by watching one ad — or never, with Nanti Pro. The tab is capped at one, and it is cleared by **RevenueCat's server**, not by the app's opinion.

> Built for the Shipaton 2026 **Catvertising Award**: _"the most creative and effective use of ads as a monetization method — clever placements, smart integration with the rest of the revenue stack, and an experience users don't hate."_

## ⚡ The one flow

```
Home (8 tiles + tab pill)
  → Form (5 fields, live paper preview)
  → "Buat PDF" → expo-print → share sheet            ← value delivered FIRST
  → Home: pill "Tab: 1 iklan · bayar nanti"
  → [next letter while the tab is open] → Settle sheet:
        "Tonton 1 iklan"  → rewarded ad → AdMob SSV → RevenueCat verifies → ADS +1 → tab clears (green, once)
        "Nanti Pro"       → RevenueCat paywall @ placement tab_locked → Pro → tab gone for good
        [no ad can be served] → "Lanjut dulu" — the letter is delivered anyway; the tab stays at 1, never 2
```

Stated precisely, because the app is held to it: **you never pay before a letter; every letter is delivered before its own ad; the one ad you owe is settled before the next free letter** — or never (Pro), or waived (no fill).

```bash
$ npx tsx bin/surat.ts demo 1      # the first demo letter, as the exact HTML the PDF is printed from
```

## 🔒 Why the tab cannot lie

`debt = clamp(exported − ADS, 0, 1)`. `exported` is a local count of letters delivered. **`ADS` is a RevenueCat virtual currency the app only reads.** The only way `debt` goes from 1 to 0 is a fresh `getVirtualCurrencies()` read after `Purchases.pollRewardVerification` resolved with a `virtual_currency` reward — which RevenueCat grants server-side after AdMob's server-side verification callback.

- `npm run ablation` greps `src/` for any client-side settle increment and must print **0**.
- The settle state machine (`src/ads/settleState.ts`) cannot reach `settled` without a `verified` event; the tests walk every event sequence up to length 4 to prove it.
- The ledger's four invariants hold under a 5,000-step random walk (`tests/ledger.test.ts`), 20,000 steps in `npm run verify:offline`, and **exhaustively over 70,602 (exported, forgiven, ADS, event) transitions** — a client event never lowers the debt (`tests/exhaustive.test.ts`).
- **299,592 settle-machine paths** to depth 6: `settled` is reached on 504 of them, every one through `verified`.

Full table and invariants: [docs/LEDGER.md](docs/LEDGER.md).

## 💳 RevenueCat is the engine

Delete RevenueCat and there is no verified ledger of settled ads → the tab can never be paid → the second letter locks forever, and there is no Pro to clear it. Fifteen SDK methods across four files:

| Where                               | Call                                                                                                                                         | Why                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Launch (`src/rc/client.ts`)         | `Purchases.configure`                                                                                                                        | anonymous customer, no accounts                                                      |
| The tab                             | `getVirtualCurrencies()` · `invalidateVirtualCurrenciesCache()`                                                                              | the ADS balance — read, never written                                                |
| Settle (`src/ads/settle.ts`)        | `generateRewardVerificationToken(impressionId)` → SSV options on the AdMob request → `pollRewardVerification(clientTransactionId, metadata)` | the verified grant; `failed` → nothing happens                                       |
| Ad lifecycle (`src/ads/tracker.ts`) | `adTracker.trackAdLoaded` · `trackAdDisplayed` · `trackAdOpened` · `trackAdRevenue` · `trackAdFailedToLoad`                                  | impression-level revenue next to subscription revenue in one LTV                     |
| Pro (`src/paywall/open.ts`)         | `getCurrentOfferingForPlacement('tab_locked')` → `RevenueCatUI.presentPaywall`                                                               | `purchasePackage` runs inside the paywall — one purchase path                        |
| Gate                                | `getCustomerInfo()` + `addCustomerInfoUpdateListener`                                                                                        | `entitlements.active.pro` hides the tab and skips the ledger                         |
| Settings                            | `restorePurchases()`                                                                                                                         | judge / reinstall path                                                               |
| After every export                  | `setAttributes({ letters_made, writer_tier })` + `syncAttributesAndOfferingsIfNeeded()`                                                      | Targeting: `writer_tier = heavy` → offering `heavy` (lifetime first) at `tab_locked` |

Dashboard objects created: entitlement `pro` · virtual currency `ADS` · Rewards rule `settle_rewarded → ADS × 1` · AdMob OAuth connection. **Configured in code, not yet created in the dashboard (as of 2026-09-26):** products `nanti_pro_monthly` (7-day free trial) + `nanti_pro_lifetime` · offerings `default` / `heavy` · placement `tab_locked` · the paywall.

## 🧪 Run it without credentials

```bash
npm install --legacy-peer-deps
npm test                    # 73 tests: 8 golden templates, ledger invariants, settle state machine, i18n parity, formatting
npm run bench               # each template rendered 1,000× — p50/p95 per template + ledger throughput; fails on golden drift
npm run verify:offline      # the offline-capable parts, no network
npm run ablation            # 0 client-side settle increments in src/
npx tsx bin/surat.ts list   # the eight templates and their fields
```

### Run the app (dev build, Android)

```bash
cp .env.example .env         # RevenueCat Test Store key; the real settle_rewarded unit id; AdMob app id
npx expo prebuild --platform android
npx expo run:android         # physical device; RevenueCat + AdMob need a dev build, not Expo Go
```

Without the real ad unit, Google's sample unit serves test creatives but **server-side verification cannot be enabled on it**, so every settle correctly comes back `failed` and the tab stays — the app never pretends otherwise. The first-run protocol and pass criteria are in [docs/SPIKE.md](docs/SPIKE.md).

## 🛠️ Engineering harness

**Pipeline:** Quality → Security → Metro bundle → Android native build → Bench + offline verification → Deploy gate (`.github/workflows/ci.yml`)

```bash
npm run ci             # prettier · eslint · tsc · vitest + coverage · bench · verify:offline · ablation · readiness
npm run bundle:check   # expo export + assert the reward/ad/paywall calls and the templates are in the Hermes bundle
npm run test:coverage  # 100 % lines over packages/surat, the ledger, the settle machine, i18n
npm run secrets        # gitleaks over the tree (CI runs it over full history)
```

| Layer                                       | Tool                                                                                                                         | Status                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Code quality                                | Prettier · ESLint 9 (flat) · tsc                                                                                             | ✅                                                                     |
| Unit tests                                  | vitest — 73 tests, 8 golden templates, 100 % lines on the pure modules                                                       | ✅                                                                     |
| High-signal tests                           | 70,602-transition + 299,592-path exhaustive · 7 defect-named regressions · "client cannot pay" boundary                      | ✅                                                                     |
| Build verification                          | Metro export + bundle assertions; Android `assembleDebug` + manifest inspection (main)                                       | ✅                                                                     |
| Security (SAST / SCA)                       | CodeQL · Dependabot alerts + security updates · version updates grouped, no majors, beta + Expo-pinned SDKs held · npm audit | ✅                                                                     |
| Secret scanning                             | gitleaks (full history) · TruffleHog (verified) · GitHub secret scanning + push protection                                   | ✅                                                                     |
| Performance                                 | template bench (p95 budget 5 ms, golden drift fails) · ledger ≈ 30 ns/transition                                             | ✅                                                                     |
| Release                                     | semantic version from Angular commits (`release.yml`)                                                                        | ✅                                                                     |
| Community                                   | CoC · Contributing · Security policy · issue & PR templates · MIT                                                            | ✅                                                                     |
| **G1 spike · settle log · device purchase** | —                                                                                                                            | ⏳ pending — the project is conditional on the spike (`docs/SPIKE.md`) |

## 📦 Repository

```
packages/surat/     8 templates → HTML (pure TS) · format.ts (Indonesian dates) · html.ts (A4 paper)
bin/surat.ts        CLI over the same package: list · render · demo
src/ledger/         tab.ts (the state machine) · store.ts (SQLite)
src/ads/            settle.ts (token → ad → poll → balance) · settleState.ts · tracker.ts
src/rc/ src/paywall/  client.ts · open.ts
src/pdf/            export.ts (expo-print → real file name → share sheet)
src/i18n/           id · en (chrome only — letters are always Indonesian)
src/screens/        Home · Form (live preview) · SettleSheet · Settings (RevenueCat receipt)
scripts/            bench · verify_offline · ablation · settle-log-export · check_submission_readiness · bundle-check
tests/              73 tests + golden/ (8 HTML files) — incl. 70,602 ledger + 299,592 settle-path exhaustive verification
docs/               LEDGER.md · SPIKE.md · DX-REPORT.md · assets/
site/               landing + privacy policy (GitHub Pages)
```

[ARCHITECTURE.md](ARCHITECTURE.md) is derived from the code · [DEMO.md](DEMO.md) has the judge path, receipts, and what is unfinished.

## 📄 License

MIT — see [LICENSE](LICENSE).
