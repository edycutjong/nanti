/**
 * The boundary Nanti's whole pitch rests on: the client can OWE, it can never PAY.
 * Only RevenueCat's server — after AdMob's server-side verification — moves ADS.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { EMPTY_LEDGER, debt, reduce } from '../src/ledger/tab';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}
const SRC = files(resolve(__dirname, '../src')).map((p) => [p, readFileSync(p, 'utf8')] as const);

describe('the tab cannot be paid by the client', () => {
  it('no client event lowers debt from 1 to 0 — only a higher server balance does', () => {
    const owed = { ...EMPTY_LEDGER, exported: 1 };
    for (const ev of [
      { type: 'export', isPro: false, adAvailable: true },
      { type: 'export', isPro: false, adAvailable: false },
      { type: 'settle:verified' },
      { type: 'settle:failed' },
      { type: 'pro:activated' },
    ] as const)
      expect(debt(reduce(owed, 0, ev).ledger, 0)).toBe(1);
    expect(debt(owed, 1)).toBe(0); // the server read is the only key
  });

  it('src/ never increments a settled counter (the ablation grep, as a test)', () => {
    for (const [p, s] of SRC) expect(s, p).not.toMatch(/settled\s*(\+\+|\+=|=\s*[a-z]+\s*\+\s*1)/);
  });

  it('src/ never writes ADS: no local balance mutation, no REST call, no secret key', () => {
    for (const [p, s] of SRC) {
      expect(s, p).not.toMatch(/setAdsBalance\((?!await|b\)|prefs\.lastAdsSeen)/); // only set from a server read or the first-paint cache
      expect(s, p).not.toMatch(/api\.revenuecat\.com/);
      expect(s, p).not.toMatch(/\bsk_[A-Za-z0-9]{8,}/);
      expect(s, p).not.toMatch(/Authorization/);
    }
  });

  it('the only path to `settled` in settle.ts is after pollRewardVerification resolves with a virtual_currency reward', () => {
    const s = readFileSync(resolve(__dirname, '../src/ads/settle.ts'), 'utf8');
    const verifiedEmits = s.match(/emit\(\{ type: 'verified' \}\)/g) ?? [];
    expect(verifiedEmits).toHaveLength(1);
    const idx = s.indexOf("emit({ type: 'verified' })");
    const before = s.slice(0, idx);
    expect(before.lastIndexOf('pollRewardVerification')).toBeGreaterThan(-1);
    expect(before.lastIndexOf("reward.type !== 'virtual_currency'")).toBeGreaterThan(
      before.lastIndexOf('pollRewardVerification'),
    );
    // and the reward-earned handler never grants anything itself
    const earned = s
      .slice(s.indexOf('EARNED_REWARD:'), s.indexOf('case AdEventType.CLOSED'))
      .replace(/\/\/.*$/gm, '');
    expect(earned).not.toMatch(/emit\(\{ type: 'verified'|readAdsBalance|balanceAfter/);
  });
});
