import { v } from '../format';
import { baris_tempat_tanggal, kepada, meta, paper, ttd } from '../html';
import type { Template } from '../types';

export const JENIS_CUTI = ['tahunan', 'sakit', 'melahirkan', 'alasan penting'] as const;

export const cuti: Template = {
  id: 'cuti',
  title: 'Surat Permohonan Cuti',
  subtitle: 'Leave request (annual, sick, maternity)',
  glyph: '🌴',
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
      label: 'Jabatan / NIP',
      labelEn: 'Position / employee no.',
      kind: 'text',
      placeholder: 'Staf Administrasi',
      maxLength: 80,
    },
    {
      key: 'tujuan',
      label: 'Ditujukan kepada',
      labelEn: 'Addressed to',
      kind: 'text',
      placeholder: 'Kepala Bagian SDM, PT Sinar Nusantara Abadi',
      maxLength: 160,
    },
    {
      key: 'jenisCuti',
      label: 'Jenis cuti',
      labelEn: 'Type of leave',
      kind: 'pick',
      placeholder: 'tahunan',
      maxLength: 20,
      options: JENIS_CUTI,
    },
    {
      key: 'tanggal',
      label: 'Tanggal mulai – selesai',
      labelEn: 'From – to',
      kind: 'range',
      placeholder: '21–25 September 2026',
      maxLength: 80,
    },
  ],
  render(f, ctx) {
    const jenis = (f.jenisCuti ?? '').trim() || 'tahunan';
    return paper(
      `${baris_tempat_tanggal(ctx.kota, ctx.tanggal)}
${meta(`Permohonan Cuti ${cap(jenis)}`)}
${kepada(v(f.tujuan))}
<p>Dengan hormat,</p>
<p>Saya yang bertanda tangan di bawah ini:</p>
<table class="ident"><tr><td>Nama</td><td>:</td><td>${v(f.nama)}</td></tr><tr><td>Jabatan / NIP</td><td>:</td><td>${v(f.jabatan)}</td></tr></table>
<p>dengan ini mengajukan permohonan cuti ${v(jenis)} pada <strong>${v(f.tanggal)}</strong>. Selama masa cuti, tugas dan tanggung jawab saya akan saya koordinasikan dengan rekan kerja sesuai arahan Bapak/Ibu.</p>
<p>Demikian permohonan ini saya sampaikan. Atas perhatian dan persetujuan Bapak/Ibu, saya ucapkan terima kasih.</p>
${ttd('Hormat saya,', v(f.nama))}`,
      'Surat Permohonan Cuti',
    );
  },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
