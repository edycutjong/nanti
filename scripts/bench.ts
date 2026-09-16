/**
 * Deterministic half of the numbers: each template rendered 1,000× in node,
 * min/p50/p95/max per template + ledger transition throughput. The other
 * half — settle-to-balance latency — is measured on the device and lives in
 * docs/SETTLE-LOG.md; the two are labelled separately and never mixed.
 * Exits non-zero if any template drifts from its golden file or p95 > 5 ms.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../packages/surat';
import { EMPTY_LEDGER, reduce } from '../src/ledger/tab';
import fixtures from '../seed/fixtures.json';

const here = dirname(fileURLToPath(import.meta.url));
const ctx = { kota: fixtures.frozen.kota, tanggal: fixtures.frozen.tanggal };
const golden = fixtures.golden as Record<string, Record<string, string>>;
const N = 1000;
const failures: string[] = [];
const q = (arr: number[], f: number) => arr[Math.min(arr.length - 1, Math.floor(arr.length * f))];

console.log(`nanti bench — ${TEMPLATES.length} templates × ${N} renders (node ${process.version})`);
console.log('  template            bytes    min      p50      p95      max');
for (const t of TEMPLATES) {
  const samples: number[] = [];
  let html = '';
  for (let i = 0; i < N; i++) {
    const t0 = performance.now();
    html = t.render(golden[t.id], ctx);
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const expected = readFileSync(resolve(here, '../tests/golden', `${t.id}.html`), 'utf8');
  if (html !== expected) failures.push(`${t.id} drifts from its golden file`);
  const p95 = q(samples, 0.95);
  if (p95 > 5) failures.push(`${t.id} p95 ${p95.toFixed(2)} ms > 5 ms`);
  const us = (n: number) => `${(n * 1000).toFixed(0).padStart(5)} µs`;
  console.log(
    `  ${t.id.padEnd(18)} ${String(html.length).padStart(6)}  ${us(samples[0])}  ${us(q(samples, 0.5))}  ${us(p95)}  ${us(samples[samples.length - 1])}`,
  );
}

// ledger throughput
let ledger = EMPTY_LEDGER;
const t0 = performance.now();
const M = 200_000;
for (let i = 0; i < M; i++)
  ledger = reduce(ledger, i % 2, { type: 'export', isPro: false, adAvailable: i % 3 !== 0 }).ledger;
const perOp = ((performance.now() - t0) / M) * 1e6;
console.log(`  ledger: ${M.toLocaleString()} transitions, ${perOp.toFixed(0)} ns each`);

if (failures.length) {
  console.error('\nFAIL');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('  PASS (golden 8/8)');
