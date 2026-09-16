import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { id } from '../src/i18n/id';
import { keyPaths, resolveLocale, strings } from '../src/i18n/t';

describe('i18n', () => {
  it('en and id have identical key sets', () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(id).sort());
  });
  it('no empty strings in either table', () => {
    for (const table of [en, id])
      for (const path of keyPaths(table)) expect(path.length).toBeGreaterThan(0);
    const leaves = (o: unknown): string[] =>
      typeof o === 'string' ? [o] : Object.values(o as object).flatMap(leaves);
    for (const s of [...leaves(en), ...leaves(id)]) expect(s.trim().length).toBeGreaterThan(0);
  });
  it('auto → Indonesian on id-* devices, English elsewhere; override wins', () => {
    expect(resolveLocale('auto', 'id')).toBe('id');
    expect(resolveLocale('auto', 'ID')).toBe('id');
    expect(resolveLocale('auto', 'en')).toBe('en');
    expect(resolveLocale('auto', null)).toBe('en');
    expect(resolveLocale('en', 'id')).toBe('en');
    expect(resolveLocale('id', 'en')).toBe('id');
  });
  it('the tab pill never shows a number above 1 in either language', () => {
    for (const s of [strings('id'), strings('en')]) expect(s.pill.owed).toMatch(/\b1\b/);
    expect(strings('id').settle.noFill).toContain('tidak pernah 2');
    expect(strings('en').settle.noFill).toContain('never 2');
  });
  it('the tagline is the canonical one', () => {
    expect(id.app.tagline).toBe('Suratnya sekarang, iklannya nanti.');
    expect(en.app.tagline).toBe('The letter now. The ad later.');
  });

  it('the settled pill composes to the exact string the asset suite renders: "Settled · ADS 0 → 1"', () => {
    // generate-readme-hero.html / generate-og-image.html show the green pill as "Settled · ADS 0 → 1";
    // TabPill renders `✓ ${pill.settled} · ADS ${before} → ${after}` on the debt 1 → 0 transition.
    const compose = (s: ReturnType<typeof strings>, before: number, after: number) =>
      `${s.pill.settled} · ADS ${before} → ${after}`;
    expect(compose(strings('en'), 0, 1)).toBe('Settled · ADS 0 → 1');
    expect(compose(strings('id'), 0, 1)).toBe('Lunas · ADS 0 → 1');
  });
});
