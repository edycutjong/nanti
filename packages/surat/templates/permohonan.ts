import { daftar, escapeHtml, jumlahBerkas, v } from '../format';
import { baris_tempat_tanggal, kepada, meta, paper, ttd } from '../html';
import type { Template } from '../types';

export const permohonan: Template = {
  id: 'permohonan',
  title: 'Surat Permohonan',
  subtitle: 'General request to an office or institution',
  glyph: '📨',
  fields: [
    {
      key: 'nama',
      label: 'Nama',
      labelEn: 'Your name',
      kind: 'text',
      placeholder: 'Yanto Prasetyo',
      maxLength: 80,
    },
    {
      key: 'instansi',
      label: 'Instansi tujuan',
      labelEn: 'Institution addressed',
      kind: 'text',
      placeholder: 'Bagian Pelayanan, Kantor Kelurahan Mekar Jaya',
      maxLength: 160,
    },
    {
      key: 'hal',
      label: 'Hal yang dimohon',
      labelEn: 'What you are requesting',
      kind: 'text',
      placeholder: 'Surat Keterangan Domisili',
      maxLength: 120,
    },
    {
      key: 'alasan',
      label: 'Alasan / keterangan',
      labelEn: 'Reason / details',
      kind: 'multiline',
      placeholder: 'untuk persyaratan pembukaan rekening bank',
      maxLength: 400,
    },
    {
      key: 'lampiran',
      label: 'Lampiran (opsional, "-" jika tidak ada)',
      labelEn: 'Attachments (optional, "-" if none)',
      kind: 'multiline',
      placeholder: 'fotokopi KTP, fotokopi Kartu Keluarga',
      maxLength: 400,
      optional: true,
    },
  ],
  render(f, ctx) {
    const items = daftar(f.lampiran);
    return paper(
      `${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${meta(`Permohonan ${v(f.hal)}`, items.length ? jumlahBerkas(items.length) : undefined)}
${kepada(v(f.instansi))}
<p>Dengan hormat,</p>
<p>Saya yang bertanda tangan di bawah ini, ${v(f.nama)}, dengan ini mengajukan permohonan ${v(f.hal)} ${v(f.alasan)}.</p>
${items.length ? `<p>Sebagai kelengkapan, bersama ini saya lampirkan:</p><ol>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>` : ''}
<p>Demikian permohonan ini saya sampaikan. Atas perhatian dan bantuan Bapak/Ibu, saya ucapkan terima kasih.</p>
${ttd('Hormat saya,', v(f.nama))}`,
      'Surat Permohonan',
    );
  },
};
