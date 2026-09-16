/**
 * packages/surat — eight Indonesian formal-letter templates as pure functions.
 *
 * Registry order = tile order on Home. Every template is golden-tested
 * (tests/golden/<id>.html) and benchmarked (scripts/bench.ts). No React
 * Native import anywhere in this package — it runs in node for the CLI.
 */
import { izinKerja } from './templates/izin-kerja';
import { izinSekolah } from './templates/izin-sekolah';
import { kuasa } from './templates/kuasa';
import { pernyataan } from './templates/pernyataan';
import { lamaran } from './templates/lamaran';
import { pengunduranDiri } from './templates/pengunduran-diri';
import { cuti } from './templates/cuti';
import { permohonan } from './templates/permohonan';
import type { RenderContext, Template, Values } from './types';

export type { Field, FieldKind, RenderContext, Template, Values } from './types';
export * from './format';

export const TEMPLATES: readonly Template[] = [
  izinKerja,
  izinSekolah,
  kuasa,
  pernyataan,
  lamaran,
  pengunduranDiri,
  cuti,
  permohonan,
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Render by id; throws on an unknown id so a typo fails loudly in tests. */
export function render(id: string, values: Values, ctx: RenderContext): string {
  const t = getTemplate(id);
  if (!t) throw new Error(`unknown template "${id}"`);
  return t.render(values, ctx);
}

/** All five fields non-empty (an optional field accepts "-"). */
export function isComplete(t: Template, values: Values): boolean {
  return t.fields.every((f) => {
    const val = (values[f.key] ?? '').trim();
    return f.optional ? val.length > 0 : val.length > 0 && val !== '-';
  });
}

/** Trim every value to its field's maxLength — the one-page guarantee. */
export function clampValues(t: Template, values: Values): Values {
  const out: Values = {};
  for (const f of t.fields) out[f.key] = (values[f.key] ?? '').slice(0, f.maxLength);
  return out;
}

/** "Surat-Izin-Kerja-Dina-Rahmawati-2026-09-15.pdf" — the template id title-cased, the first field (the writer) slugged. */
export function pdfFileName(t: Template, values: Values, isoDate: string): string {
  const who = Object.values(values)[0] ?? '';
  const slug = who
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const jenis = t.id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
  return `Surat-${jenis}${slug ? `-${slug}` : ''}-${isoDate}.pdf`;
}
