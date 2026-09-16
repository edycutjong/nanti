/**
 * The two decision functions that must never be wrong, verified across their
 * whole input space rather than on examples. Counts are printed for the README.
 */
import { describe, expect, it } from 'vitest';
import { debt, reduce, type Ledger, type LedgerEvent } from '../src/ledger/tab';
import { TERMINAL, next, type SettleEvent, type SettleState } from '../src/ads/settleState';

describe('exhaustive verification', () => {
  it('ledger: every (exported, forgiven, ADS, event) — debt stays in {0,1}, never falls through a client event, blocked exactly when it should', () => {
    const EVENTS: LedgerEvent[] = [
      { type: 'export', isPro: false, adAvailable: true },
      { type: 'export', isPro: false, adAvailable: false },
      { type: 'export', isPro: true, adAvailable: true },
      { type: 'export', isPro: true, adAvailable: false },
      { type: 'settle:verified' },
      { type: 'settle:failed' },
      { type: 'pro:activated' },
    ];
    let cases = 0;
    let violations = 0;
    for (let exported = 0; exported <= 40; exported++)
      for (let forgiven = 0; forgiven <= 5; forgiven++)
        for (let ads = 0; ads <= 40; ads++)
          for (const ev of EVENTS) {
            cases++;
            const before: Ledger = { exported, forgiven, proExports: 0 };
            const d0 = debt(before, ads);
            const t = reduce(before, ads, ev);
            const d1 = debt(t.ledger, ads);
            const shouldBlock = ev.type === 'export' && !ev.isPro && d0 === 1 && ev.adAvailable;
            const ok =
              (d0 === 0 || d0 === 1) &&
              (d1 === 0 || d1 === 1) &&
              d1 >= d0 && // a client event can never lower the debt — only a server balance read can
              t.blocked === shouldBlock &&
              t.ledger.exported >= before.exported &&
              t.ledger.forgiven >= before.forgiven &&
              (t.ledger.forgiven === before.forgiven ||
                (ev.type === 'export' && !ev.isPro && !ev.adAvailable && d0 === 1)) &&
              !('ads' in t.ledger) &&
              !('adsBalance' in t.ledger);
            if (!ok) violations++;
          }
    expect(cases).toBe(41 * 6 * 41 * 7);
    expect(violations).toBe(0);
    console.log(
      `exhaustive ledger: ${cases.toLocaleString()} transitions verified, ${violations} violations`,
    );
  });

  it("settle machine: every event sequence up to depth 6 — 'settled' is reached only through 'verified', terminal states are absorbing", () => {
    const EVENTS: SettleEvent['type'][] = [
      'start',
      'loaded',
      'load_error',
      'earned',
      'closed',
      'verified',
      'verify_failed',
      'reset',
    ];
    let paths = 0;
    let violations = 0;
    let settledPaths = 0;
    const walk = (s: SettleState, depth: number, sawVerified: boolean) => {
      if (depth === 0) return;
      for (const type of EVENTS) {
        paths++;
        const n = next(s, { type } as SettleEvent);
        const v = sawVerified || type === 'verified';
        if (n === 'settled') {
          settledPaths++;
          if (!v) violations++;
        }
        if (TERMINAL.includes(s) && type !== 'reset' && n !== s) violations++;
        walk(n, depth - 1, type === 'reset' ? false : v);
      }
    };
    walk('idle', 6, false);
    expect(paths).toBe(8 + 8 ** 2 + 8 ** 3 + 8 ** 4 + 8 ** 5 + 8 ** 6);
    expect(violations).toBe(0);
    expect(settledPaths).toBeGreaterThan(0);
    console.log(
      `exhaustive settle: ${paths.toLocaleString()} paths walked, ${settledPaths.toLocaleString()} reach settled (all via verified), ${violations} violations`,
    );
  });
});
