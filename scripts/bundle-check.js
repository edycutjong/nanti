// After `expo export`: prove the Hermes bundle carries the judged calls and the templates.
const fs = require('node:fs');
const d = 'dist/_expo/static/js/android';
const f = fs.readdirSync(d).find((x) => x.endsWith('.hbc') || x.endsWith('.js'));
const b = fs.readFileSync(`${d}/${f}`);
const s = b.toString('latin1');
for (const k of [
  'generateRewardVerificationToken',
  'pollRewardVerification',
  'trackAdRevenue',
  'getVirtualCurrencies',
  'getCurrentOfferingForPlacement',
  'presentPaywall',
  'SURAT KUASA',
  'Permohonan Izin Tidak Masuk Kerja',
]) {
  if (!s.includes(k)) {
    console.error(`bundle missing: ${k}`);
    process.exit(1);
  }
}
console.log(`bundle ok: ${f} ${(b.length / 1024) | 0} KB`);
