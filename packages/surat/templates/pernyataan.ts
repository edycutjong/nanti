import { v } from '../format';
import { baris_tempat_tanggal, paper, ttd } from '../html';
import type { Template } from '../types';

export const pernyataan: Template = {
  id: 'pernyataan',
  title: 'Surat Pernyataan',
  subtitle: 'Sworn statement for a bank, campus or office',
  glyph: '📝',
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
      key: 'nik',
      label: 'NIK',
      labelEn: 'ID number (NIK)',
      kind: 'text',
      placeholder: '3374567812340003',
      maxLength: 20,
    },
    {
      key: 'alamat',
      label: 'Alamat',
      labelEn: 'Address',
      kind: 'text',
      placeholder: 'Jl. Melati No. 12, Yogyakarta',
      maxLength: 160,
    },
    {
      key: 'isi',
      label: 'Isi pernyataan',
      labelEn: 'Statement',
      kind: 'multiline',
      placeholder: 'belum pernah menerima beasiswa dari lembaga manapun',
      maxLength: 400,
    },
    {
      key: 'keperluan',
      label: 'Keperluan',
      labelEn: 'Purpose',
      kind: 'text',
      placeholder: 'persyaratan pendaftaran beasiswa',
      maxLength: 120,
    },
  ],
  render(f, ctx) {
    return paper(
      `<p class="title">SURAT PERNYATAAN</p>
<p>Saya yang bertanda tangan di bawah ini:</p>
<table class="ident"><tr><td>Nama</td><td>:</td><td>${v(f.nama)}</td></tr><tr><td>NIK</td><td>:</td><td>${v(f.nik)}</td></tr><tr><td>Alamat</td><td>:</td><td>${v(f.alamat)}</td></tr></table>
<p>dengan ini menyatakan dengan sesungguhnya bahwa saya ${v(f.isi)}.</p>
<p>Surat pernyataan ini dibuat untuk ${v(f.keperluan)}.</p>
<p>Demikian pernyataan ini saya buat dengan sebenar-benarnya dan tanpa paksaan dari pihak manapun. Apabila di kemudian hari pernyataan ini terbukti tidak benar, saya bersedia menerima sanksi sesuai ketentuan yang berlaku.</p>
${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${ttd('Yang menyatakan,', v(f.nama), true)}`,
      'Surat Pernyataan',
    );
  },
};
