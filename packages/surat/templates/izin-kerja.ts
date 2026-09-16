import { v } from '../format';
import { baris_tempat_tanggal, kepada, meta, paper, ttd } from '../html';
import type { Template } from '../types';

export const izinKerja: Template = {
  id: 'izin-kerja',
  title: 'Surat Izin Tidak Masuk Kerja',
  subtitle: 'Leave of absence from work',
  glyph: '🏢',
  fields: [
    {
      key: 'nama',
      label: 'Nama',
      labelEn: 'Your name',
      kind: 'text',
      placeholder: 'Dina Rahmawati',
      maxLength: 80,
    },
    {
      key: 'jabatan',
      label: 'Jabatan',
      labelEn: 'Position',
      kind: 'text',
      placeholder: 'Staf Administrasi',
      maxLength: 80,
    },
    {
      key: 'tujuan',
      label: 'Ditujukan kepada',
      labelEn: 'Addressed to',
      kind: 'text',
      placeholder: 'Kepala Bagian SDM, PT …',
      maxLength: 120,
    },
    {
      key: 'alasan',
      label: 'Alasan',
      labelEn: 'Reason',
      kind: 'multiline',
      placeholder: 'sakit demam, disertai surat keterangan dokter',
      maxLength: 400,
    },
    {
      key: 'tanggalIzin',
      label: 'Tanggal izin',
      labelEn: 'Date(s) of leave',
      kind: 'date',
      placeholder: 'Selasa, 15 September 2026',
      maxLength: 80,
    },
  ],
  render(f, ctx) {
    return paper(
      `${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${meta('Permohonan Izin Tidak Masuk Kerja')}
${kepada(v(f.tujuan))}
<p>Dengan hormat,</p>
<p>Saya yang bertanda tangan di bawah ini:</p>
<table class="ident"><tr><td>Nama</td><td>:</td><td>${v(f.nama)}</td></tr><tr><td>Jabatan</td><td>:</td><td>${v(f.jabatan)}</td></tr></table>
<p>dengan ini mengajukan permohonan izin tidak masuk kerja pada <strong>${v(f.tanggalIzin)}</strong> dikarenakan ${v(f.alasan)}.</p>
<p>Demikian permohonan ini saya sampaikan. Atas perhatian dan izin yang diberikan, saya ucapkan terima kasih.</p>
${ttd('Hormat saya,', v(f.nama))}`,
      'Surat Izin Tidak Masuk Kerja',
    );
  },
};
