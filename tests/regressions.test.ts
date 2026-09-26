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

  it('ci_setup_android_requested_the_removed_sdk_tools_package (2026-09-23, first public CI run)', () => {
    // setup-android@v3 defaults to `tools platform-tools`; `tools` is gone from the
    // SDK repository, so Stage 4 died in sdkmanager before Gradle ever ran.
    const ci = src('.github/workflows/ci.yml');
    const step = ci.slice(ci.indexOf('android-actions/setup-android'));
    const pkgs = /packages:\s*([^\n]+)/.exec(step.slice(0, 200));
    expect(pkgs, 'setup-android must pin its packages input').not.toBeNull();
    expect(pkgs![1].split(/\s+/)).not.toContain('tools');
  });
  it('readiness_checked_the_retired_package_id_app_nanti_surat (2026-09-26 audit)', () => {
    // The package moved to dev.edycu.nanti on 2026-09-17; the readiness warning would never clear.
    const r = src('scripts/check_submission_readiness.js');
    expect(r).not.toMatch(/app\\\.nanti\\\.surat/);
    expect(r).toMatch(/dev\\\.edycu\\\.nanti/);
  });

  it('dev_builds_could_request_the_live_admob_rewarded_unit (2026-09-26 audit)', () => {
    // AdMob policy: development builds must serve Google's test unit, never the live one.
    const s = src('src/ads/settle.ts');
    expect(s).toMatch(/dev: boolean = __DEV__/);
    expect(s).toMatch(
      /if \(dev \|\| !envUnit\) return \{ id: TestIds\.REWARDED, isSample: true \}/,
    );
  });

  it('an_ad_request_could_precede_mobile_ads_initialize (2026-09-26 audit)', () => {
    // Crash class seen elsewhere in this event: a native SDK touched before it was initialised.
    const s = src('src/ads/settle.ts');
    expect(s.indexOf('await initAds()')).toBeGreaterThan(-1);
    expect(s.indexOf('await initAds()')).toBeLessThan(
      s.lastIndexOf('RewardedAd.createForAdRequest('),
    );
    expect(s.indexOf('await initAds()')).toBeLessThan(s.lastIndexOf('ad.load()'));
    expect(src('App.tsx')).not.toMatch(/mobileAds\(\)/);
    // RevenueCat: configure runs in AppProvider before `ready`; Gate renders nothing that can
    // call Purchases until then.
    const ctx = src('src/state/AppContext.tsx');
    expect(ctx.indexOf('configurePurchases()')).toBeLessThan(
      ctx.indexOf('onCustomerInfo(setInfo)'),
    );
    expect(src('App.tsx')).toMatch(/const ready = app\.ready && fontsLoaded/);
  });

  it('token_failure_left_the_settle_sheet_spinning_forever (2026-09-26 audit)', () => {
    // generateRewardVerificationToken rejecting (offline, Ads beta off) was an unhandled rejection
    // with the sheet stuck in `loading` and its close button disabled. Now it is no_fill.
    const s = src('src/ads/settle.ts');
    const tok = s.slice(s.indexOf('try {\n    token = await'), s.indexOf('let tEarned'));
    expect(tok).toMatch(/catch \{[\s\S]*emit\(\{ type: 'load_error' \}\)[\s\S]*outcome: 'no_fill'/);
    expect(next('loading', { type: 'load_error' })).toBe('no_fill');
  });

  it('pro_button_was_a_silent_no_op_with_no_offerings (2026-09-26 audit)', () => {
    // With no products/offering in the dashboard the Pro button threw an unhandled rejection and
    // showed nothing. Now: 'unavailable' → a visible message in both locales.
    const open = src('src/paywall/open.ts');
    expect(open).toMatch(
      /if \(!offering \|\| offering\.availablePackages\.length === 0\) return 'unavailable'/,
    );
    const sheet = src('src/screens/SettleSheet.tsx');
    expect(sheet).toMatch(/outcome === 'unavailable'\) setProNote\(t\.settle\.proUnavailable\)/);
    expect(sheet).toMatch(/outcome === 'error'\) setProNote\(t\.settle\.proError\)/);
    for (const l of [en, id]) {
      expect(l.settle.proUnavailable.length).toBeGreaterThan(10);
      expect(l.settle.proError.length).toBeGreaterThan(10);
    }
  });

  it('rewarded_button_did_not_state_the_reward (2026-09-26 audit)', () => {
    // AdMob rewarded policy: opt-in with a clearly stated reward. "~20 s" was also never measured.
    expect(en.settle.watch).toBe('Watch 1 ad to clear the tab');
    expect(id.settle.watch).toBe('Tonton 1 iklan untuk melunasi tab');
    expect(en.settle.watch + id.settle.watch).not.toMatch(/20/);
  });
});
