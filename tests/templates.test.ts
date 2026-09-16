import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TEMPLATES,
  clampValues,
  getTemplate,
  isComplete,
  pdfFileName,
  render,
} from '../packages/surat';
import fixtures from '../seed/fixtures.json';

const ctx = { kota: fixtures.frozen.kota, tanggal: fixtures.frozen.tanggal };
const golden = fixtures.golden as Record<string, Record<string, string>>;

describe('eight templates', () => {
  it('registry has 8 templates with 5 fields each and unique ids', () => {
    expect(TEMPLATES.length).toBe(8);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(8);
    for (const t of TEMPLATES) expect(t.fields.length).toBe(5);
  });

  for (const t of TEMPLATES) {
    it(`${t.id} renders byte-identical to tests/golden/${t.id}.html`, () => {
      const expected = readFileSync(resolve(__dirname, 'golden', `${t.id}.html`), 'utf8');
      expect(render(t.id, golden[t.id], ctx)).toBe(expected);
    });
  }

  it('every letter carries the tempat/tanggal line, a signature name, and A4 paper CSS', () => {
    for (const t of TEMPLATES) {
      const html = render(t.id, golden[t.id], ctx);
      expect(html).toContain('Jakarta, 15 September 2026');
      expect(html).toContain('@page { size: A4');
      expect(html).toContain('class="name"');
    }
  });

  it('kuasa has two identity blocks and a dual signature row; pernyataan has a meterai box', () => {
    expect((render('kuasa', golden.kuasa, ctx).match(/class="ident"/g) ?? []).length).toBe(2);
    expect(render('kuasa', golden.kuasa, ctx)).toContain('Pemberi Kuasa,');
    expect(render('kuasa', golden.kuasa, ctx)).toContain('Penerima Kuasa,');
    expect(render('pernyataan', golden.pernyataan, ctx)).toContain('class="meterai"');
  });

  it('lamaran enumerates attachments and counts them on the Lampiran line', () => {
    const html = render('lamaran', golden.lamaran, ctx);
    expect(html).toContain('3 (tiga) berkas');
    expect(html).toContain('<li>pasfoto 4×6</li>');
  });

  it('pengunduran-diri bolds the effective-date sentence', () => {
    expect(render('pengunduran-diri', golden['pengunduran-diri'], ctx)).toMatch(
      /<strong class="eff">Pengunduran diri ini berlaku efektif terhitung sejak 30 September 2026\.<\/strong>/,
    );
  });

  it('permohonan derives Perihal from the request and omits Lampiran when "-"', () => {
    const html = render('permohonan', { ...golden.permohonan, lampiran: '-' }, ctx);
    expect(html).toContain('Permohonan Surat Keterangan Domisili');
    expect(html).not.toContain('Lampiran');
  });

  it('empty fields render as dotted blanks, never as "undefined"', () => {
    for (const t of TEMPLATES) {
      const html = render(t.id, {}, ctx);
      expect(html).not.toContain('undefined');
      expect(html).toContain('class="blank"');
    }
  });

  it('a 400-character reason stays inside the field cap (one-page guarantee)', () => {
    const t = getTemplate('izin-kerja')!;
    const long = 'x'.repeat(1000);
    const clamped = clampValues(t, { ...golden['izin-kerja'], alasan: long });
    expect(clamped.alasan.length).toBe(400);
    expect(render(t.id, clamped, ctx).length).toBeLessThan(6000);
  });

  it('field input is escaped on the paper', () => {
    const html = render(
      'izin-kerja',
      { ...golden['izin-kerja'], nama: '<img src=x onerror=1>' },
      ctx,
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('isComplete: all five non-empty; optional accepts "-"', () => {
    expect(isComplete(getTemplate('izin-kerja')!, golden['izin-kerja'])).toBe(true);
    expect(isComplete(getTemplate('izin-kerja')!, { ...golden['izin-kerja'], alasan: '' })).toBe(
      false,
    );
    expect(isComplete(getTemplate('permohonan')!, { ...golden.permohonan, lampiran: '-' })).toBe(
      true,
    );
    expect(isComplete(getTemplate('permohonan')!, { ...golden.permohonan, lampiran: '' })).toBe(
      false,
    );
  });

  it('isComplete treats a missing key the same as an empty value', () => {
    expect(isComplete(getTemplate('izin-kerja')!, {})).toBe(false);
  });

  it('clampValues fills in a missing key as an empty string', () => {
    const t = getTemplate('izin-kerja')!;
    expect(clampValues(t, {})).toEqual({
      nama: '',
      jabatan: '',
      tujuan: '',
      alasan: '',
      tanggalIzin: '',
    });
  });

  it('pdfFileName is a real name, not Print_xxx.pdf', () => {
    expect(pdfFileName(getTemplate('izin-kerja')!, golden['izin-kerja'], '2026-09-15')).toBe(
      'Surat-Izin-Kerja-Dina-Rahmawati-2026-09-15.pdf',
    );
  });

  it('pdfFileName with no values at all omits the writer slug entirely', () => {
    expect(pdfFileName(getTemplate('izin-kerja')!, {}, '2026-09-15')).toBe(
      'Surat-Izin-Kerja-2026-09-15.pdf',
    );
  });

  it('pdfFileName normalizes non-ASCII and truncates a long writer slug to 40 chars', () => {
    const long = 'ÁÉÍÓÚ ' + 'Wibowo '.repeat(10);
    const name = pdfFileName(getTemplate('izin-kerja')!, { nama: long }, '2026-09-15');
    const slug = name.replace('Surat-Izin-Kerja-', '').replace('-2026-09-15.pdf', '');
    expect(slug.length).toBe(40);
    expect(slug.startsWith('AEIOU-Wibowo')).toBe(true);
  });

  it('unknown template id throws', () => {
    expect(() => render('nope', {}, ctx)).toThrow(/unknown template/);
  });

  it('fixtures use only fictional names and companies (hygiene list)', () => {
    const text = JSON.stringify(fixtures);
    for (const banned of ['Gojek', 'Tokopedia', 'Telkom', 'Pertamina', 'Bank Mandiri', 'BCA'])
      expect(text).not.toContain(banned);
  });
});
