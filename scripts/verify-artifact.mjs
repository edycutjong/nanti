#!/usr/bin/env node
/**
 * Pre-upload artifact gate — never upload an AAB/APK that has not passed this.
 *
 * `EXPO_PUBLIC_*` values are inlined into the JS bundle at bundle time, and
 * `.env` is not a tracked Gradle input for `createBundleReleaseJsAndAssets`, so
 * a release build after a key change can package a STALE bundle with an empty
 * key while reporting BUILD SUCCESSFUL. The file installs, launches, is signed —
 * and cannot talk to RevenueCat. This checks the bytes, not the build log.
 *
 *   set -a; . ~/.config/nanti/secrets.env; set +a
 *   node scripts/verify-artifact.mjs ../assets/release/nanti-1.0.0-1-play.aab
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

const target = process.argv[2];
if (!target || !existsSync(target)) {
  console.error('usage: node scripts/verify-artifact.mjs <apk|aab>');
  process.exit(2);
}
const isAab = target.endsWith('.aab');
const bundlePath = isAab ? 'base/assets/index.android.bundle' : 'assets/index.android.bundle';

let bundle = null;
try {
  bundle = execFileSync('unzip', ['-p', target, bundlePath], {
    maxBuffer: 64 * 1024 * 1024,
    encoding: 'latin1',
  });
} catch {
  bundle = null;
}

const checks = [];
const add = (ok, label, detail) => checks.push({ ok, label, detail });

add(
  bundle !== null && bundle.length > 0,
  'JS bundle embedded',
  bundle
    ? `${(bundle.length / 1e6).toFixed(2)} MB at ${bundlePath}`
    : `missing ${bundlePath} — debug build?`,
);

// The Play build must carry the Play (goog_) public key. The Test Store key
// may also be inlined (both env names are referenced in purchases.ts); the
// store switch is EXPO_PUBLIC_RC_STORE=GOOGLE at bundle time.
const googKey = process.env.EXPO_PUBLIC_RC_GOOGLE_KEY;
if (!googKey)
  add(
    false,
    'EXPO_PUBLIC_RC_GOOGLE_KEY available to check',
    'source ~/.config/nanti/secrets.env first',
  );
else if (!googKey.startsWith('goog_'))
  add(false, 'EXPO_PUBLIC_RC_GOOGLE_KEY looks like a Play key', 'expected prefix "goog_"');
else
  add(
    bundle !== null && bundle.includes(googKey),
    'Play public key baked into the bundle',
    `looking for ${googKey.slice(0, 5)}… (${googKey.length} chars)`,
  );

// The rewarded ad unit id is inlined the same way; the sample-unit fallback
// compiles but every settle then correctly ends `failed`.
const unit = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT;
if (!unit)
  add(
    false,
    'EXPO_PUBLIC_ADMOB_REWARDED_UNIT available to check',
    'source ~/.config/nanti/secrets.env first',
  );
else if (unit.startsWith('ca-app-pub-3940256099942544'))
  add(false, 'real AdMob rewarded unit (not the sample)', unit);
else
  add(
    bundle !== null && bundle.includes(unit),
    'AdMob rewarded unit baked into the bundle',
    `looking for ${unit.slice(0, 14)}…`,
  );

try {
  const certs = execFileSync('jarsigner', ['-verify', '-verbose:summary', '-certs', target], {
    maxBuffer: 32 * 1024 * 1024,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const debugSigned = /CN=Android Debug/i.test(certs);
  add(
    !debugSigned,
    'signed with a real upload key',
    debugSigned ? 'CN=Android Debug — Play rejects this' : 'not the Android debug certificate',
  );
} catch {
  add(false, 'signature readable', 'jarsigner could not verify the artifact');
}

console.log(`\n  ${target}  (${(statSync(target).size / 1e6).toFixed(1)} MB)\n`);
let failed = 0;
for (const c of checks) {
  console.log(`  ${c.ok ? '✅' : '❌'} ${c.label}`);
  if (c.detail) console.log(`       ${c.detail}`);
  if (!c.ok) failed++;
}
console.log(
  failed === 0 ? '\n  PASS — safe to upload.\n' : `\n  FAIL — ${failed} check(s). Do NOT upload.\n`,
);
process.exit(failed === 0 ? 0 : 1);
