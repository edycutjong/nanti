/**
 * The paper. One stylesheet for the preview, the PDF and the CLI output —
 * A4, 3 cm / 2.5 cm margins, 12 pt serif, 1.5 line-height, the convention
 * for Indonesian formal letters. No external assets: the PDF must render
 * offline on the device.
 */
import { escapeHtml, tempatTanggal } from './format';

export const PAPER_CSS = `
@page { size: A4; margin: 3cm 2.5cm; }
html, body { background: #FFFDF7; color: #171B22; }
body { font-family: "Times New Roman", "Noto Serif", "Liberation Serif", serif; font-size: 12pt; line-height: 1.5; margin: 0; }
p { margin: 0 0 0.6em 0; text-align: justify; }
.right { text-align: right; }
.center { text-align: center; }
.title { text-align: center; font-weight: bold; font-size: 14pt; letter-spacing: 0.08em; text-decoration: underline; margin-bottom: 1.2em; }
.meta td { padding: 0 0.6em 0 0; vertical-align: top; }
.ident { margin: 0.4em 0 0.8em 1.5em; }
.ident td { padding: 0 0.6em 0 0; vertical-align: top; }
.sig { margin-top: 2.2em; width: 100%; }
.sig td { width: 50%; vertical-align: top; text-align: center; }
.sig .name { margin-top: 4.5em; font-weight: bold; text-decoration: underline; }
.meterai { display: inline-block; width: 3.6cm; height: 2.2cm; border: 1px dashed #777; font-size: 8pt; color: #777; line-height: 2.2cm; margin: 0.4em 0; }
.blank { color: #9A9A9A; letter-spacing: 0.08em; }
ol { margin: 0 0 0.6em 0; padding-left: 1.6em; }
strong.eff { font-weight: bold; }
`;

export function paper(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${PAPER_CSS}</style></head>
<body>
${bodyHtml}
</body></html>
`;
}

/** The "Jakarta, 15 September 2026" line, right-aligned. */
export function baris_tempat_tanggal(kota: string, tanggal: string): string {
  return `<p class="right">${escapeHtml(tempatTanggal(kota, tanggal))}</p>`;
}

/** The Lampiran / Perihal meta table (Lampiran row optional). */
export function meta(perihal: string, lampiran?: string): string {
  const rows = [
    lampiran ? `<tr><td>Lampiran</td><td>:</td><td>${escapeHtml(lampiran)}</td></tr>` : '',
    `<tr><td>Perihal</td><td>:</td><td><strong>${perihal}</strong></td></tr>`,
  ]
    .filter(Boolean)
    .join('\n');
  return `<table class="meta">\n${rows}\n</table>`;
}

/** The addressee block. `lines` are already-escaped/rendered HTML lines. */
export function kepada(...lines: string[]): string {
  return `<p>Kepada Yth.<br>${lines.join('<br>')}<br>di tempat</p>`;
}

/** A single right-hand signature block: role line, space, name. */
export function ttd(role: string, nameHtml: string, withMeterai = false): string {
  return `<table class="sig"><tr><td></td><td>${role}<br>${withMeterai ? '<div class="meterai">meterai</div><br>' : ''}<div class="name">${nameHtml}</div></td></tr></table>`;
}

/** Two signature blocks side by side (Surat Kuasa). */
export function ttd2(
  leftRole: string,
  leftName: string,
  rightRole: string,
  rightName: string,
): string {
  return `<table class="sig"><tr><td>${leftRole}<br><div class="name" style="margin-top:4.5em">${leftName}</div></td><td>${rightRole}<br><div class="meterai">meterai</div><br><div class="name">${rightName}</div></td></tr></table>`;
}
