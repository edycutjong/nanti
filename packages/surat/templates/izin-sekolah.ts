import { v } from '../format';
import { baris_tempat_tanggal, kepada, meta, paper, ttd } from '../html';
import type { Template } from '../types';

export const izinSekolah: Template = {
  id: 'izin-sekolah',
  title: 'Surat Izin Tidak Masuk Sekolah',
  subtitle: 'School absence note from a parent',
  glyph: '🎒',
  fields: [
    {
      key: 'namaWali',
      label: 'Nama orang tua / wali',
      labelEn: 'Parent / guardian name',
      kind: 'text',
      placeholder: 'Yanto Prasetyo',
      maxLength: 80,
    },
    {
      key: 'namaSiswa',
      label: 'Nama siswa',
      labelEn: 'Student name',
      kind: 'text',
      placeholder: 'Putri Ayu Prasetyo',
      maxLength: 80,
    },
    {
      key: 'kelasSekolah',
      label: 'Kelas dan sekolah',
      labelEn: 'Class and school',
      kind: 'text',
      placeholder: 'Kelas 4B, SD Negeri 07 Pagi Cempaka',
      maxLength: 120,
    },
    {
      key: 'alasan',
      label: 'Alasan',
      labelEn: 'Reason',
      kind: 'multiline',
      placeholder: 'sakit demam',
      maxLength: 400,
    },
    {
      key: 'tanggalIzin',
      label: 'Tanggal izin',
      labelEn: 'Date(s) of absence',
      kind: 'date',
      placeholder: 'Selasa, 15 September 2026',
      maxLength: 80,
    },
  ],
  render(f, ctx) {
    return paper(
      `${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${meta('Permohonan Izin Tidak Masuk Sekolah')}
${kepada('Bapak/Ibu Wali Kelas', v(f.kelasSekolah))}
<p>Dengan hormat,</p>
<p>Saya yang bertanda tangan di bawah ini, orang tua/wali dari:</p>
<table class="ident"><tr><td>Nama siswa</td><td>:</td><td>${v(f.namaSiswa)}</td></tr><tr><td>Kelas</td><td>:</td><td>${v(f.kelasSekolah)}</td></tr></table>
<p>memberitahukan bahwa anak saya tidak dapat mengikuti kegiatan belajar di sekolah pada <strong>${v(f.tanggalIzin)}</strong> dikarenakan ${v(f.alasan)}.</p>
<p>Demikian surat izin ini saya sampaikan. Atas perhatian dan izin Bapak/Ibu, saya ucapkan terima kasih.</p>
${ttd('Orang Tua/Wali,', v(f.namaWali))}`,
      'Surat Izin Tidak Masuk Sekolah',
    );
  },
};
