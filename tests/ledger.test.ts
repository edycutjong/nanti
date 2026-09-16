import { describe, expect, it } from 'vitest';
import {
  EMPTY_LEDGER,
  debt,
  lettersMade,
  reduce,
  writerTier,
  type Ledger,
} from '../src/ledger/tab';

const L = (exported: number, forgiven = 0, proExports = 0): Ledger => ({
  exported,
  forgiven,
  proExports,
});

describe('debt = clamp(exported − ADS, 0, 1) — I1', () => {
  it('is 0 or 1 for every combination in a wide grid', () => {
    for (let e = 0; e <= 20; e++)
      for (let a = -3; a <= 25; a++) expect([0, 1]).toContain(debt(L(e), a));
  });
  it('reads the obvious cases', () => {
    expect(debt(L(0), 0)).toBe(0);
    expect(debt(L(1), 0)).toBe(1);
    expect(debt(L(1), 1)).toBe(0);
    expect(debt(L(5), 4)).toBe(1);
    expect(debt(L(0), 7)).toBe(0); // reinstall: credit the user earned, no debt
  });
});

describe('the export table (spec §4.2)', () => {
  it('pro → pro_exports += 1, tab untouched', () => {
    const t = reduce(L(1), 0, { type: 'export', isPro: true, adAvailable: true });
    expect(t.rule).toBe('pro-export');
    expect(t.ledger).toEqual(L(1, 0, 1));
    expect(t.blocked).toBe(false);
  });
  it('free, debt 0 → exported += 1, debt becomes 1', () => {
    const t = reduce(EMPTY_LEDGER, 0, { type: 'export', isPro: false, adAvailable: true });
    expect(t.rule).toBe('open-tab');
    expect(debt(t.ledger, 0)).toBe(1);
  });
  it('free, debt 1, ad available → BLOCKED (settle sheet), ledger unchanged', () => {
    const t = reduce(L(1), 0, { type: 'export', isPro: false, adAvailable: true });
    expect(t.rule).toBe('blocked');
    expect(t.blocked).toBe(true);
    expect(t.ledger).toEqual(L(1));
  });
  it('free, debt 1, no ad → grace: forgiven += 1, debt stays 1 (never 2)', () => {
    const t = reduce(L(1), 0, { type: 'export', isPro: false, adAvailable: false });
    expect(t.rule).toBe('grace');
    expect(t.ledger).toEqual(L(1, 1));
    expect(debt(t.ledger, 0)).toBe(1);
  });
  it('a settled ad (server balance +1) clears the tab without any local write — I3', () => {
    const before = L(1);
    const t = reduce(before, 0, { type: 'settle:verified' });
    expect(t.rule).toBe('noop');
    expect(t.ledger).toBe(before);
    expect(debt(t.ledger, 1)).toBe(0); // the balance read did the work
  });
  it('settle:failed and pro:activated change nothing locally', () => {
    expect(reduce(L(1), 0, { type: 'settle:failed' }).ledger).toEqual(L(1));
    expect(reduce(L(1), 0, { type: 'pro:activated' }).ledger).toEqual(L(1));
  });
});

describe('I2 and I4 under a random walk', () => {
  it('ADS ≤ exported ≤ ADS + 1 holds across 5,000 random exports/settles on an unwiped device', () => {
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    let ledger = EMPTY_LEDGER;
    let ads = 0; // the server's balance, moved ONLY by verified settles
    for (let i = 0; i < 5000; i++) {
      const r = rnd();
      if (r < 0.5) {
        const t = reduce(ledger, ads, { type: 'export', isPro: false, adAvailable: rnd() < 0.9 });
        ledger = t.ledger;
      } else if (debt(ledger, ads) === 1 && rnd() < 0.7) {
        ads += 1; // pollRewardVerification resolved with a reward → the server granted +1
      }
      expect(ads).toBeLessThanOrEqual(ledger.exported);
      expect(ledger.exported).toBeLessThanOrEqual(ads + 1);
      expect([0, 1]).toContain(debt(ledger, ads));
    }
  });
  it('I4: forgiven never moves unless adAvailable is false', () => {
    let ledger = L(1);
    for (let i = 0; i < 50; i++)
      ledger = reduce(ledger, 0, { type: 'export', isPro: false, adAvailable: true }).ledger;
    expect(ledger.forgiven).toBe(0);
  });
});

describe('writer tier for Targeting', () => {
  it('new 0–1 · regular 2 · heavy ≥ 3', () => {
    expect(writerTier(0)).toBe('new');
    expect(writerTier(1)).toBe('new');
    expect(writerTier(2)).toBe('regular');
    expect(writerTier(3)).toBe('heavy');
    expect(writerTier(40)).toBe('heavy');
  });
  it('letters made counts every delivered letter, whoever paid for it', () => {
    expect(lettersMade(L(2, 1, 3))).toBe(6);
  });
});
