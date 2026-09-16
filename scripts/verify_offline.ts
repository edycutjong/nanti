/**
 * The offline-capable parts, verified with no network: all 8 templates render
 * byte-identical to golden; the ledger holds I1–I4 under a random walk.
 * Settling is ONLINE by design (RevenueCat verifies AdMob's SSV callback) —
 * this script says so and exits 0 only on the offline parts.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../packages/surat';
import { EMPTY_LEDGER, debt, reduce } from '../src/ledger/tab';
import fixtures from '../seed/fixtures.json';

const here = dirname(fileURLToPath(import.meta.url));
const ctx = { kota: fixtures.frozen.kota, tanggal: fixtures.frozen.tanggal };
const golden = fixtures.golden as Record<string, Record<string, string>>;
let ok = true;

for (const t of TEMPLATES) {
  const same =
    t.render(golden[t.id], ctx) ===
    readFileSync(resolve(here, '../tests/golden', `${t.id}.html`), 'utf8');
  console.log(`${same ? '✓' : '✗'} template ${t.id}`);
  ok &&= same;
}

let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
let ledger = EMPTY_LEDGER;
let ads = 0;
let holds = true;
for (let i = 0; i < 20000; i++) {
  if (rnd() < 0.5)
    ledger = reduce(ledger, ads, { type: 'export', isPro: false, adAvailable: rnd() < 0.9 }).ledger;
  else if (debt(ledger, ads) === 1 && rnd() < 0.7) ads += 1;
  holds &&=
    ads <= ledger.exported && ledger.exported <= ads + 1 && [0, 1].includes(debt(ledger, ads));
}
console.log(`${holds ? '✓' : '✗'} ledger invariants I1–I4 over 20,000 steps`);
ok &&= holds;

console.log(
  'ⓘ settling is online by design: pollRewardVerification needs RevenueCat + AdMob SSV — not checked here',
);
process.exit(ok ? 0 : 1);
