/**
 * Regenerates tests/golden/<id>.html from seed/fixtures.json with the frozen
 * date and city. Run ONLY when a template change is intended; the diff in the
 * golden file is the review surface. `npm test` byte-compares against these.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../packages/surat';
import fixtures from '../seed/fixtures.json';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../tests/golden');
mkdirSync(OUT, { recursive: true });
const ctx = { kota: fixtures.frozen.kota, tanggal: fixtures.frozen.tanggal };
for (const t of TEMPLATES) {
  const values = (fixtures.golden as Record<string, Record<string, string>>)[t.id];
  if (!values) throw new Error(`no golden fixture for ${t.id}`);
  writeFileSync(resolve(OUT, `${t.id}.html`), t.render(values, ctx));
  console.log(`golden: ${t.id}.html`);
}
