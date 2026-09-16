/**
 * Turns a settle_log dump into docs/SETTLE-LOG.md with p50/p95 of
 * (t_verified − t_earned) and (t_balance − t_earned) over VERIFIED rows.
 *
 * Get the dump off the device (dev build):
 *   adb shell "run-as dev.edycu.nanti cat databases/nanti.db" > /tmp/nanti.db
 *   sqlite3 -json /tmp/nanti.db "select * from settle_log order by t_earned" > /tmp/settle.json
 *   npm run settle-log -- /tmp/settle.json
 *
 * The published number is the measured one, whatever it is. N is printed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Row {
  impression_id: string;
  t_earned: number;
  t_verified: number | null;
  t_balance: number | null;
  balance_before: number;
  balance_after: number | null;
  outcome: string;
}

const file = process.argv[2];
if (!file) {
  console.error('usage: npm run settle-log -- <settle.json>');
  process.exit(1);
}
const rows: Row[] = JSON.parse(readFileSync(file, 'utf8'));
const verified = rows.filter((r) => r.outcome === 'verified' && r.t_verified && r.t_balance);
const q = (arr: number[], f: number) =>
  arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * f))] : NaN;
const dv = verified.map((r) => (r.t_verified! - r.t_earned) / 1000).sort((a, b) => a - b);
const db = verified.map((r) => (r.t_balance! - r.t_earned) / 1000).sort((a, b) => a - b);
const by = (o: string) => rows.filter((r) => r.outcome === o).length;

const md = `# Settle log — measured on a physical Android

Generated ${new Date().toISOString()} from ${rows.length} settle attempts (N verified = ${verified.length}).
Every row is a real AdMob rewarded ad on the \`settle_rewarded\` unit, verified server-side by RevenueCat
(\`pollRewardVerification\`), followed by a fresh \`getVirtualCurrencies()\` read. Nothing here is simulated.

| metric | p50 | p95 | max |
|---|---|---|---|
| EARNED_REWARD → verified | ${q(dv, 0.5).toFixed(1)} s | ${q(dv, 0.95).toFixed(1)} s | ${(dv[dv.length - 1] ?? NaN).toFixed(1)} s |
| EARNED_REWARD → ADS balance +1 visible | ${q(db, 0.5).toFixed(1)} s | ${q(db, 0.95).toFixed(1)} s | ${(db[db.length - 1] ?? NaN).toFixed(1)} s |

Outcomes: verified ${by('verified')} · failed ${by('failed')} · no_fill ${by('no_fill')} · closed_early ${by('closed_early')}

| impression | earned (UTC) | verify Δ | balance Δ | before → after | outcome |
|---|---|---|---|---|---|
${rows.map((r) => `| ${r.impression_id.slice(0, 8)} | ${new Date(r.t_earned).toISOString()} | ${r.t_verified ? ((r.t_verified - r.t_earned) / 1000).toFixed(1) + ' s' : '—'} | ${r.t_balance ? ((r.t_balance - r.t_earned) / 1000).toFixed(1) + ' s' : '—'} | ${r.balance_before} → ${r.balance_after ?? '—'} | ${r.outcome} |`).join('\n')}
`;
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/SETTLE-LOG.md');
writeFileSync(out, md);
console.log(`wrote ${out}: N=${verified.length}, p95 balance ${q(db, 0.95).toFixed(1)} s`);
