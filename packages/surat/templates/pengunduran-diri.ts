import { v } from '../format';
import { baris_tempat_tanggal, kepada, meta, paper, ttd } from '../html';
import type { Template } from '../types';

export const pengunduranDiri: Template = {
  id: 'pengunduran-diri',
  title: 'Surat Pengunduran Diri',
  subtitle: 'Resignation letter',
  glyph: '🚪',
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
      label: 'Perusahaan dan atasan',
      labelEn: 'Company and manager',
      kind: 'text',
      placeholder: 'Kepala Bagian SDM, PT Sinar Nusantara Abadi',
      maxLength: 160,
    },
    {
      key: 'tanggalEfektif',
      label: 'Tanggal efektif',
      labelEn: 'Effective date',
      kind: 'date',
      placeholder: '30 September 2026',
      maxLength: 80,
    },
    {
      key: 'alasan',
      label: 'Alasan singkat',
      labelEn: 'Brief reason',
      kind: 'multiline',
      placeholder: 'melanjutkan pendidikan',
      maxLength: 400,
    },
  ],
  render(f, ctx) {
    return paper(
      `${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${meta('Pengunduran Diri')}
${kepada(v(f.tujuan))}
<p>Dengan hormat,</p>
<p>Saya yang bertanda tangan di bawah ini:</p>
<table class="ident"><tr><td>Nama</td><td>:</td><td>${v(f.nama)}</td></tr><tr><td>Jabatan</td><td>:</td><td>${v(f.jabatan)}</td></tr></table>
<p>dengan ini mengajukan pengunduran diri dari jabatan tersebut dikarenakan ${v(f.alasan)}. <strong class="eff">Pengunduran diri ini berlaku efektif terhitung sejak ${v(f.tanggalEfektif)}.</strong></p>
<p>Saya mengucapkan terima kasih atas kesempatan, bimbingan dan pengalaman yang telah diberikan selama saya bekerja di perusahaan ini. Saya mohon maaf apabila selama bekerja terdapat kesalahan yang saya lakukan, dan saya bersedia membantu proses serah terima pekerjaan hingga tanggal efektif tersebut.</p>
<p>Demikian surat pengunduran diri ini saya sampaikan. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.</p>
${ttd('Hormat saya,', v(f.nama))}`,
      'Surat Pengunduran Diri',
    );
  },
};
