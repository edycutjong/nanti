#!/usr/bin/env node
/**
 * Self-ablation (W2): the tab has no client-side way to be paid.
 * Greps src/ for any increment of a "settled" counter. Must print 0.
 */
const { execSync } = require('node:child_process');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..');
let hits = '';
try {
  hits = execSync(String.raw`grep -rnE "settled\s*(\+\+|\+=|=\s*[a-z]+\s*\+\s*1)" src/`, {
    cwd: root,
    encoding: 'utf8',
  });
} catch (e) {
  // grep exits 1 on no match — that is the pass.
  if (e.status !== 1) throw e;
}
const n = hits.trim() ? hits.trim().split('\n').length : 0;
console.log(`ablation: ${n} client-side settle increments in src/ (must be 0)`);
if (n) {
  console.log(hits);
  process.exit(1);
}
