#!/usr/bin/env tsx
/**
 * surat — the letter templates from the command line (a by-product of the
 * pure package; nothing here is app-only).
 *
 *   npx tsx bin/surat.ts list
 *   npx tsx bin/surat.ts render --template izin-kerja --fields seed/demo1.json [--kota Bandung] [--tanggal "1 Oktober 2026"] > out.html
 *   npx tsx bin/surat.ts demo 1|2|3            # the three fixture letters
 */
import { readFileSync } from 'node:fs';
import { TEMPLATES, formatTanggal, render } from '../packages/surat';
import fixtures from '../seed/fixtures.json';

const [cmd, ...rest] = process.argv.slice(2);
const flag = (n: string) => {
  const i = rest.indexOf(`--${n}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

if (cmd === 'list') {
  for (const t of TEMPLATES)
    console.log(`${t.id.padEnd(18)} ${t.title}  —  ${t.fields.map((f) => f.key).join(', ')}`);
} else if (cmd === 'render') {
  const id = flag('template');
  const file = flag('fields');
  if (!id || !file) {
    console.error('usage: surat render --template <id> --fields <json> [--kota X] [--tanggal Y]');
    process.exit(1);
  }
  const values = JSON.parse(readFileSync(file, 'utf8'));
  process.stdout.write(
    render(id, values, {
      kota: flag('kota') ?? 'Jakarta',
      tanggal: flag('tanggal') ?? formatTanggal(new Date()),
    }),
  );
} else if (cmd === 'demo') {
  const n = rest[0] ?? '1';
  const d = (fixtures.demo as Record<string, { template: string; fields: Record<string, string> }>)[
    `letter${n}`
  ];
  if (!d) {
    console.error('demo 1, 2 or 3');
    process.exit(1);
  }
  process.stdout.write(
    render(d.template, d.fields, { kota: fixtures.frozen.kota, tanggal: fixtures.frozen.tanggal }),
  );
} else {
  console.log('surat list | render --template <id> --fields <json> | demo 1|2|3');
}
