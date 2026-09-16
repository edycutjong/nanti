/** Indonesian formal-letter formatting: dates, day names, ranges, escaping. */

export const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

/** "15 September 2026" */
export function formatTanggal(d: Date): string {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Selasa, 15 September 2026" */
export function formatHariTanggal(d: Date): string {
  return `${HARI[d.getDay()]}, ${formatTanggal(d)}`;
}

/**
 * A date range the way Indonesian letters write it:
 *   same month  → "15–22 September 2026"
 *   same year   → "28 September – 2 Oktober 2026"
 *   otherwise   → "30 Desember 2026 – 2 Januari 2027"
 */
export function formatRentang(a: Date, b: Date): string {
  if (a.getTime() > b.getTime()) [a, b] = [b, a];
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    if (a.getDate() === b.getDate()) return formatTanggal(a);
    return `${a.getDate()}–${b.getDate()} ${BULAN[a.getMonth()]} ${a.getFullYear()}`;
  }
  if (a.getFullYear() === b.getFullYear())
    return `${a.getDate()} ${BULAN[a.getMonth()]} – ${formatTanggal(b)}`;
  return `${formatTanggal(a)} – ${formatTanggal(b)}`;
}

/** "Jakarta, 15 September 2026" */
export function tempatTanggal(kota: string, tanggal: string): string {
  return `${kota}, ${tanggal}`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A value for the paper: escaped, or the dotted placeholder when empty so the letter's shape shows from the first second. */
export function v(value: string | undefined): string {
  const t = (value ?? '').trim();
  return t ? escapeHtml(t) : '<span class="blank">………………</span>';
}

/** Multiline → paragraphs; single newlines become <br>. */
export function para(value: string | undefined): string {
  const t = (value ?? '').trim();
  if (!t) return `<p>${v('')}</p>`;
  return t
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/** "a, b, c" → ["a","b","c"]; "-" or empty → []. */
export function daftar(value: string | undefined): string[] {
  const t = (value ?? '').trim();
  if (!t || t === '-') return [];
  return t
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "3 (tiga)" style count for the Lampiran line. */
export function jumlahBerkas(n: number): string {
  const kata = [
    'nol',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
  ];
  return n <= 10 ? `${n} (${kata[n]}) berkas` : `${n} berkas`;
}
