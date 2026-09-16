import { daftar, escapeHtml, jumlahBerkas, v } from '../format';
import { baris_tempat_tanggal, kepada, meta, paper, ttd } from '../html';
import type { Template } from '../types';

export const lamaran: Template = {
  id: 'lamaran',
  title: 'Surat Lamaran Kerja',
  subtitle: 'Job application cover letter',
  glyph: '💼',
  fields: [
    {
      key: 'nama',
      label: 'Nama',
      labelEn: 'Your name',
      kind: 'text',
      placeholder: 'Rani Kusuma Dewi',
      maxLength: 80,
    },
    {
      key: 'posisi',
      label: 'Posisi yang dilamar',
      labelEn: 'Position applied for',
      kind: 'text',
      placeholder: 'Staf Keuangan',
      maxLength: 80,
    },
    {
      key: 'perusahaan',
      label: 'Perusahaan dan alamat',
      labelEn: 'Company and address',
      kind: 'text',
      placeholder: 'PT Sinar Nusantara Abadi, Jl. Sudirman No. 1, Jakarta',
      maxLength: 160,
    },
    {
      key: 'pendidikan',
      label: 'Pendidikan terakhir',
      labelEn: 'Highest education',
      kind: 'text',
      placeholder: 'S1 Akuntansi, Universitas Bina Cendekia (2025)',
      maxLength: 120,
    },
    {
      key: 'lampiran',
      label: 'Lampiran (pisahkan dengan koma)',
      labelEn: 'Attachments (comma-separated)',
      kind: 'multiline',
      placeholder: 'daftar riwayat hidup, fotokopi ijazah, pasfoto 4×6',
      maxLength: 400,
    },
  ],
  render(f, ctx) {
    const items = daftar(f.lampiran);
    return paper(
      `${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${meta('Lamaran Pekerjaan', items.length ? jumlahBerkas(items.length) : '-')}
${kepada('Bagian Personalia', v(f.perusahaan))}
<p>Dengan hormat,</p>
<p>Saya yang bertanda tangan di bawah ini, ${v(f.nama)}, dengan pendidikan terakhir ${v(f.pendidikan)}, bermaksud mengajukan lamaran untuk posisi <strong>${v(f.posisi)}</strong> di perusahaan yang Bapak/Ibu pimpin.</p>
<p>Sebagai bahan pertimbangan, bersama ini saya lampirkan:</p>
${items.length ? `<ol>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>` : `<p>${v('')}</p>`}
<p>Besar harapan saya untuk dapat diberikan kesempatan wawancara agar dapat menjelaskan potensi diri saya lebih lanjut. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.</p>
${ttd('Hormat saya,', v(f.nama))}`,
      'Surat Lamaran Kerja',
    );
  },
};
