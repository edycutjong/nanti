import { describe, expect, it } from 'vitest';
import {
  BULAN,
  HARI,
  daftar,
  escapeHtml,
  formatHariTanggal,
  formatRentang,
  formatTanggal,
  jumlahBerkas,
  tempatTanggal,
  v,
} from '../packages/surat/format';
import { split } from '../packages/surat/templates/kuasa';

describe('Indonesian date formatting', () => {
  it('d MMMM yyyy with Indonesian month names', () => {
    expect(formatTanggal(new Date(2026, 8, 15))).toBe('15 September 2026');
    expect(formatTanggal(new Date(2026, 0, 1))).toBe('1 Januari 2026');
    expect(BULAN.length).toBe(12);
  });
  it('day names', () => {
    expect(formatHariTanggal(new Date(2026, 8, 15))).toBe('Selasa, 15 September 2026');
    expect(HARI[0]).toBe('Minggu');
  });
  it('ranges: same month · same year · across years · same day · reversed', () => {
    expect(formatRentang(new Date(2026, 8, 15), new Date(2026, 8, 22))).toBe(
      '15–22 September 2026',
    );
    expect(formatRentang(new Date(2026, 8, 28), new Date(2026, 9, 2))).toBe(
      '28 September – 2 Oktober 2026',
    );
    expect(formatRentang(new Date(2026, 11, 30), new Date(2027, 0, 2))).toBe(
      '30 Desember 2026 – 2 Januari 2027',
    );
    expect(formatRentang(new Date(2026, 8, 15), new Date(2026, 8, 15))).toBe('15 September 2026');
    expect(formatRentang(new Date(2026, 8, 22), new Date(2026, 8, 15))).toBe(
      '15–22 September 2026',
    );
  });
  it('tempat, tanggal', () => {
    expect(tempatTanggal('Jakarta', '15 September 2026')).toBe('Jakarta, 15 September 2026');
  });
});

describe('field helpers', () => {
  it('escapes HTML so a field cannot inject markup into the PDF', () => {
    expect(escapeHtml('<b>&"')).toBe('&lt;b&gt;&amp;&quot;');
    expect(v('<script>')).toBe('&lt;script&gt;');
  });
  it('empty values render the dotted placeholder', () => {
    expect(v('')).toContain('class="blank"');
    expect(v(undefined)).toContain('………');
  });
  it('daftar splits attachments; "-" means none', () => {
    expect(daftar('a, b; c')).toEqual(['a', 'b', 'c']);
    expect(daftar('-')).toEqual([]);
    expect(daftar('')).toEqual([]);
  });
  it('jumlahBerkas spells the count', () => {
    expect(jumlahBerkas(3)).toBe('3 (tiga) berkas');
    expect(jumlahBerkas(12)).toBe('12 berkas');
  });
  it('kuasa split: "Name — NIK 123" and bare names', () => {
    expect(split('Dina Rahmawati — NIK 3171234567890001')).toEqual([
      'Dina Rahmawati',
      '3171234567890001',
    ]);
    expect(split('Yanto - 12 34')).toEqual(['Yanto', '1234']);
    expect(split('Yanto Prasetyo')).toEqual(['Yanto Prasetyo', '']);
  });
});
