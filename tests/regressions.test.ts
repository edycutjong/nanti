/**
 * Regression tests, each named after the defect it pins — a changelog of
 * real bugs found while building, not a coverage exercise.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { en } from '../src/i18n/en';
import { id } from '../src/i18n/id';
import { next } from '../src/ads/settleState';

const require = createRequire(import.meta.url);
const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');

describe('regressions', () => {
  it('kotlin_metadata_plugin_appends_the_compiler_flag_once_and_is_idempotent (2026-09-16)', () => {
    // Four native-build attempts: Expo 53 codegen, Kotlin 2.3 metadata in play-services-ads 25.4.0,
    // a 25.3.0 pin with the same metadata, a 24.9.0 pin that broke the library's own source.
    // The fix is this plugin; a second prebuild must not append the block twice.
    const { patch, MARKER } = require('../plugins/withKotlinMetadataCheck.js');
    const once = patch('buildscript {}\n');
    expect(once).toContain(MARKER);
    expect(once).toContain('-Xskip-metadata-version-check');
    expect(patch(once)).toBe(once);
    expect((patch(patch(once)).match(/skip-metadata-version-check/g) ?? []).length).toBe(1);
  });

  it('pdf_export_used_the_legacy_expo_file_system_api_removed_in_sdk_54 (2026-09-16)', () => {
    // cacheDirectory / moveAsync / deleteAsync moved to expo-file-system/legacy in SDK 54;
    // the port uses the File/Paths API. A revert would typecheck against /legacy and ship a deprecation.
    const s = src('src/pdf/export.ts');
    expect(s).not.toMatch(/cacheDirectory|moveAsync|deleteAsync|expo-file-system\/legacy/);
    expect(s).toMatch(/import \{ File, Paths \} from 'expo-file-system'/);
  });

  it('strings_type_narrowed_by_as_const_blocked_english_from_carrying_different_text (2026-09-16)', () => {
    // `export const id = {...} as const` made Strings a literal type, so en.ts failed to compile
    // with 40 "not assignable" errors. Strings is now the deep-widened shape: same keys, free text.
    expect(en.app.tagline).not.toBe(id.app.tagline);
    expect(en.settle.watch).not.toBe(id.settle.watch);
  });

  it('settle_sheet_state_survived_the_ad_closing_while_verification_was_in_flight (design, 2026-09-16)', () => {
    // AdMob fires CLOSED after EARNED_REWARD; treating that as closed_early would drop a verified
    // settle on the floor and leave the user with a paid tab that still shows as owed.
    expect(next('verifying', { type: 'closed' })).toBe('verifying');
    expect(next(next('verifying', { type: 'closed' }), { type: 'verified' })).toBe('settled');
  });

  it('kuasa_template_split_names_with_en_dash_em_dash_and_hyphen (2026-09-16)', () => {
    // The fixture uses an em dash; a phone keyboard types a hyphen. Both must yield NIK on its own line.
    const s = src('tests/golden/kuasa.html');
    expect(s).toContain('<td>NIK</td><td>:</td><td>3171234567890001</td>');
    expect(s).not.toContain('— NIK');
  });

  it('lanjut_dulu_recorded_a_forgiven_export_without_delivering_the_letter (2026-09-16 audit)', () => {
    // The no-fill "Continue for now" button called recordExport(false) from App.tsx with a
    // pendingGrace that nothing ever set — forgiven += 1, no letter. Now it ARMS grace; Home lets
    // the next tile through; Form runs recordExport(!graceArmed) when the PDF is actually made.
    const app = src('App.tsx');
    expect(app).not.toMatch(/pendingGrace|app\.recordExport\(false\)/);
    expect(app).toMatch(/setGraceArmed\(true\)/);
    const home = src('src/screens/Home.tsx');
    expect(home).toMatch(/debt === 1 && !isPro && !graceArmed \? onSettle\(\) : onPick\(tpl\)/);
    const form = src('src/screens/Form.tsx');
    expect(form).toMatch(/recordExport\(!graceArmed\)/);
    // recordExport is called from exactly one place in the app: the moment the letter is exported.
    const all = [
      app,
      home,
      form,
      src('src/screens/SettleSheet.tsx'),
      src('src/screens/Settings.tsx'),
    ]
      .join('\n')
      .replace(/\/\/.*$/gm, '');
    expect((all.match(/recordExport\(/g) ?? []).length).toBe(1);
  });
});
