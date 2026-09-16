# The tab — a post-paid ledger

`debt = clamp(exported − ADS, 0, 1)`

| Term          | Where it lives                    | Who writes it                                                                            |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `exported`    | device (SQLite `ledger.exported`) | the app, on a letter delivered while debt was 0                                          |
| `forgiven`    | device                            | the app, on a letter delivered under no-fill grace                                       |
| `pro_exports` | device                            | the app, on a letter delivered while `pro` was active                                    |
| **`ADS`**     | **RevenueCat (virtual currency)** | **RevenueCat's server, after AdMob's server-side verification callback — never the app** |

## The export table (`src/ledger/tab.ts`, tested in `tests/ledger.test.ts`)

| Event             | Guard                                 | Transition                                                               |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| `export`          | `isPro`                               | `pro_exports += 1` — tab untouched, never shown                          |
| `export`          | `!isPro && debt == 0`                 | `exported += 1` → debt 1 (the pill appears **after** the share sheet)    |
| `export`          | `!isPro && debt == 1 && adAvailable`  | **blocked** → Settle sheet (watch · Pro · later)                         |
| `export`          | `!isPro && debt == 1 && !adAvailable` | `forgiven += 1` → debt stays 1 ("Lanjut dulu" — never 2)                 |
| `settle:verified` | reward.type == virtual_currency       | no local write; the next `getVirtualCurrencies()` read shows +1 → debt 0 |
| `settle:failed`   | —                                     | nothing changes; the user may try another ad                             |
| `pro:activated`   | entitlement active                    | tab hidden; ledger frozen                                                |

## Invariants

- **I1** `debt ∈ {0, 1}` — a wide grid in the tests
- **I2** `ADS ≤ exported ≤ ADS + 1` while the device has never been wiped — a 5,000-step random walk in the tests, 20,000 in `npm run verify:offline`
- **I3** no transition writes to the ADS side — `settle:verified` is a no-op on the ledger; only a server balance read lowers `debt`
- **I4** `forgiven` only increments on a real ad-load failure, never on user choice

## Self-ablation

`npm run ablation` greps `src/` for `settled++`, `settled +=`, `settled = x + 1` and must print 0. The settle state
machine (`src/ads/settleState.ts`) cannot reach `settled` without a `verified` event, and that event is emitted in
exactly one place: after `Purchases.pollRewardVerification` resolves with a `virtual_currency` reward
(`src/ads/settle.ts`). The tests walk every event sequence up to length 4 and assert `settled` is unreachable otherwise.

## Trust model on reinstall

A reinstall resets `exported` to 0 → debt 0. The user keeps whatever ADS credit they earned (it is theirs, on the
server). Documented as deliberate: the app would rather forgive a letter than lock someone out of a document they
already have.
