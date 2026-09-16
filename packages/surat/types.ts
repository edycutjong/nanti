/**
 * A template is five fields and a pure render function: (values, ctx) → HTML.
 * The same HTML feeds the live preview (WebView), expo-print (PDF), the
 * `surat` CLI and the golden tests, so what you see is byte-for-byte what
 * you send.
 */
export type FieldKind = 'text' | 'multiline' | 'date' | 'range' | 'pick';

export interface Field {
  key: string;
  /** Indonesian label — the letters are always Indonesian. */
  label: string;
  /** English label for the chrome when the app runs in `en`. */
  labelEn: string;
  kind: FieldKind;
  placeholder: string;
  /** Every field is capped so any letter fits one A4 page. */
  maxLength: number;
  /** For kind 'pick'. */
  options?: readonly string[];
  /** '-' is an accepted "none" for optional fields. */
  optional?: boolean;
}

export interface RenderContext {
  /** City for the tempat/tanggal line, e.g. "Jakarta". */
  kota: string;
  /** Already-formatted Indonesian date, e.g. "15 September 2026". */
  tanggal: string;
}

export type Values = Record<string, string>;

export interface Template {
  id: string;
  /** Indonesian title, e.g. "Surat Izin Tidak Masuk Kerja". */
  title: string;
  /** One-line English subtitle for the tile. */
  subtitle: string;
  glyph: string;
  fields: readonly [Field, Field, Field, Field, Field];
  render(values: Values, ctx: RenderContext): string;
}
