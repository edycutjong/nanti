/**
 * The tab — a post-paid ledger, as a pure state machine.
 *
 *   debt = clamp(exported − ADS, 0, 1)
 *
 * `exported` is local (letters delivered while a tab could be owed).
 * `ADS` is the RevenueCat virtual-currency balance — read from the server,
 * NEVER written here. There is no code path in this file, or anywhere in
 * src/, that can mark an ad as paid: the only way `debt` goes from 1 to 0
 * is a fresh server balance read after `pollRewardVerification` verified
 * the reward (I3). `npm run ablation` greps for the forbidden increment.
 *
 * Invariants (tests/ledger.test.ts):
 *   I1  debt ∈ {0, 1}
 *   I2  ADS ≤ exported ≤ ADS + 1 while the device has never been wiped
 *   I3  no transition touches ADS
 *   I4  `forgiven` only increments on a real ad-load failure, never on choice
 */
export interface Ledger {
  /** Letters delivered while debt was 0 (each one opens a tab). */
  exported: number;
  /** Letters delivered under no-fill grace — the house ate the ad. */
  forgiven: number;
  /** Letters delivered while `pro` was active — no tab. */
  proExports: number;
}

export const EMPTY_LEDGER: Ledger = { exported: 0, forgiven: 0, proExports: 0 };

export type Debt = 0 | 1;

export function debt(ledger: Pick<Ledger, 'exported'>, adsBalance: number): Debt {
  const d = ledger.exported - Math.max(0, adsBalance);
  return d <= 0 ? 0 : 1;
}

export type ExportEvent = { type: 'export'; isPro: boolean; adAvailable: boolean };
export type SettleEvent =
  { type: 'settle:verified' } | { type: 'settle:failed' } | { type: 'pro:activated' };
export type LedgerEvent = ExportEvent | SettleEvent;

export interface Transition {
  ledger: Ledger;
  /** true = the export is blocked and the Settle sheet must open. */
  blocked: boolean;
  /** Which row of the table fired — for the tests and the receipt panel. */
  rule: 'pro-export' | 'open-tab' | 'blocked' | 'grace' | 'noop';
}

export function reduce(ledger: Ledger, adsBalance: number, ev: LedgerEvent): Transition {
  if (ev.type !== 'export') return { ledger, blocked: false, rule: 'noop' };
  if (ev.isPro)
    return {
      ledger: { ...ledger, proExports: ledger.proExports + 1 },
      blocked: false,
      rule: 'pro-export',
    };
  const d = debt(ledger, adsBalance);
  if (d === 0)
    return {
      ledger: { ...ledger, exported: ledger.exported + 1 },
      blocked: false,
      rule: 'open-tab',
    };
  if (ev.adAvailable) return { ledger, blocked: true, rule: 'blocked' };
  return { ledger: { ...ledger, forgiven: ledger.forgiven + 1 }, blocked: false, rule: 'grace' };
}

/** "new" 0–1 letters · "regular" 2 · "heavy" ≥ 3 — the RevenueCat Targeting attribute. */
export type WriterTier = 'new' | 'regular' | 'heavy';
export function writerTier(lettersMade: number): WriterTier {
  if (lettersMade >= 3) return 'heavy';
  if (lettersMade === 2) return 'regular';
  return 'new';
}
export function lettersMade(l: Ledger): number {
  return l.exported + l.forgiven + l.proExports;
}
