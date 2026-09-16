import { v } from '../format';
import { baris_tempat_tanggal, paper, ttd2 } from '../html';
import type { Template } from '../types';

/** Two identity blocks, a dual signature row, a meterai box — visibly not the same layout as the others. */
export const kuasa: Template = {
  id: 'kuasa',
  title: 'Surat Kuasa',
  subtitle: 'Power of attorney for one errand',
  glyph: '🤝',
  fields: [
    {
      key: 'pemberi',
      label: 'Pemberi kuasa (nama — NIK)',
      labelEn: 'Grantor (name — ID no.)',
      kind: 'text',
      placeholder: 'Dina Rahmawati — NIK 3171234567890001',
      maxLength: 120,
    },
    {
      key: 'penerima',
      label: 'Penerima kuasa (nama — NIK)',
      labelEn: 'Grantee (name — ID no.)',
      kind: 'text',
      placeholder: 'Yanto Prasetyo — NIK 3275098765430002',
      maxLength: 120,
    },
    {
      key: 'keperluan',
      label: 'Keperluan',
      labelEn: 'What is delegated',
      kind: 'multiline',
      placeholder: 'mengambil dokumen Kartu Keluarga',
      maxLength: 400,
    },
    {
      key: 'instansi',
      label: 'Instansi / tempat',
      labelEn: 'Office / place',
      kind: 'text',
      placeholder: 'Kantor Kelurahan Mekar Jaya',
      maxLength: 120,
    },
    {
      key: 'masaBerlaku',
      label: 'Masa berlaku',
      labelEn: 'Valid for',
      kind: 'range',
      placeholder: '15–22 September 2026',
      maxLength: 80,
    },
  ],
  render(f, ctx) {
    const [pemberiNama, pemberiNik] = split(f.pemberi);
    const [penerimaNama, penerimaNik] = split(f.penerima);
    return paper(
      `<p class="title">SURAT KUASA</p>
<p>Saya yang bertanda tangan di bawah ini:</p>
<table class="ident"><tr><td>Nama</td><td>:</td><td>${v(pemberiNama)}</td></tr><tr><td>NIK</td><td>:</td><td>${v(pemberiNik)}</td></tr></table>
<p>selanjutnya disebut sebagai <strong>Pemberi Kuasa</strong>, dengan ini memberikan kuasa kepada:</p>
<table class="ident"><tr><td>Nama</td><td>:</td><td>${v(penerimaNama)}</td></tr><tr><td>NIK</td><td>:</td><td>${v(penerimaNik)}</td></tr></table>
<p>selanjutnya disebut sebagai <strong>Penerima Kuasa</strong>, untuk ${v(f.keperluan)} di ${v(f.instansi)} atas nama Pemberi Kuasa.</p>
<p>Surat kuasa ini berlaku pada <strong>${v(f.masaBerlaku)}</strong> dan dibuat untuk dipergunakan sebagaimana mestinya.</p>
${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${ttd2('Penerima Kuasa,', v(penerimaNama), 'Pemberi Kuasa,', v(pemberiNama))}`,
      'Surat Kuasa',
    );
  },
};

/** "Name — NIK 123" → ["Name", "123"]; a bare name → [name, ""]. */
export function split(s: string | undefined): [string, string] {
  const t = (s ?? '').trim();
  const m = /^(.*?)\s*[—–-]\s*(?:NIK\s*)?(\d[\d\s]*)$/i.exec(t);
  return m ? [m[1].trim(), m[2].replace(/\s/g, '')] : [t, ''];
}
