#!/usr/bin/env node
/**
 * Fails on what a judge would trip over: placeholders, kill-switch flags on
 * the reproduce path, missing store essentials. Warns on human-gated URLs.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) =>
  fs.existsSync(path.join(root, p)) ? fs.readFileSync(path.join(root, p), 'utf8') : null;
const problems = [];
const warns = [];

for (const f of [
  'README.md',
  'DEMO.md',
  'JUDGE.md',
  'ARCHITECTURE.md',
  'docs/LEDGER.md',
  'docs/SPIKE.md',
]) {
  const body = read(f);
  if (body === null) {
    problems.push(`${f} missing`);
    continue;
  }
  for (const m of body.matchAll(/\b(TBD|TODO|FIXME|FILL_ME|XXX)\b|<(insert|paste|your)[^>]*>/gi))
    problems.push(`${f}: placeholder "${m[0]}"`);
  for (const m of body.matchAll(/(MOCK=|MOCK_MODE|USE_MOCK|DEMO_MODE|OFFLINE=1|--dry-run)/g))
    problems.push(`${f}: kill-switch flag "${m[0]}"`);
}

for (const p of [
  'assets/icon.png',
  'assets/adaptive-icon.png',
  'assets/splash.png',
  'site/index.html',
  'site/privacy.html',
])
  if (!fs.existsSync(path.join(root, p))) problems.push(`${p} missing`);

const readme = read('README.md') || '';
if (!/play\.google\.com\/store\/apps\/details\?id=dev\.edycu\.nanti/.test(readme))
  warns.push('README.md has no Play listing URL yet');
if (!/youtu\.?be/.test(readme)) warns.push('README.md has no demo video URL yet');
if (!fs.existsSync(path.join(root, 'docs/SETTLE-LOG.md')))
  warns.push('docs/SETTLE-LOG.md not generated yet (N settles on a device → npm run settle-log)');
const spike = read('docs/SPIKE.md') || '';
if (/RESULT:\s*not yet run/i.test(spike))
  warns.push('docs/SPIKE.md: G1 spike not yet run — the project is CONDITIONAL until it is');

for (const w of warns) console.log(`  ⚠ ${w}`);
for (const p of problems) console.log(`  ✗ ${p}`);
console.log(`\nreadiness: ${problems.length} problem(s), ${warns.length} warning(s)`);
process.exit(problems.length ? 1 : 0);
