/** Locale resolution: an explicit override wins; otherwise `id-*` devices get Indonesian, everyone else English. */
import { en } from './en';
import { id, type Strings } from './id';

export type Locale = 'id' | 'en';
export type LocalePref = 'auto' | Locale;

export function resolveLocale(
  pref: LocalePref,
  deviceLanguageCode: string | null | undefined,
): Locale {
  if (pref !== 'auto') return pref;
  return (deviceLanguageCode ?? '').toLowerCase().startsWith('id') ? 'id' : 'en';
}

export function strings(locale: Locale): Strings {
  return locale === 'id' ? id : en;
}

/** Every dotted key path in a strings table — for the parity test. */
export function keyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, val]) =>
    keyPaths(val, prefix ? `${prefix}.${k}` : k),
  );
}
