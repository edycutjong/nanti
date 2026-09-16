/**
 * Let Kotlin 2.1 (Expo 54 / RN 0.81) link against play-services-ads 25.4.0.
 *
 * react-native-google-mobile-ads@16.5.0 declares play-services-ads:25.4.0 in
 * its own package.json (no override hook), and every 25.x release of that
 * SDK is compiled with Kotlin 2.3.0. kotlinc refuses metadata from a newer
 * compiler by default:
 *
 *   e: play-services-ads-25.4.0-api.jar ... Module was compiled with an
 *      incompatible version of Kotlin. The binary version of its metadata
 *      is 2.3.0, expected version is 2.1.0.
 *
 * What was tried first (2026-09-16), so nobody repeats it:
 *   - force 25.3.0: same 2.3.0 metadata (the POM's kotlin-stdlib 2.1.0 line
 *     says nothing about the compiler used).
 *   - force 24.9.0: metadata OK, but the library's own Kotlin source uses
 *     AgeRestrictedTreatment, a 25.x API → unresolved reference.
 *
 * `-Xskip-metadata-version-check` makes kotlinc accept the newer metadata;
 * within a major version the format is forward-readable, and the module's
 * compileDebugKotlin passes with it. Applied to every Kotlin compile task in
 * the root build.gradle so it survives `prebuild --clean`. Drop this plugin
 * once Expo's Kotlin catches up with the Ads SDK's.
 */
const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = '// nanti: kotlin metadata';
const BLOCK = `
${MARKER}
allprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    compilerOptions.freeCompilerArgs.add("-Xskip-metadata-version-check")
  }
}
`;

/** Pure: append the block once. Exported so tests/regressions.test.ts can pin it without Expo. */
function patch(contents) {
  return contents.includes(MARKER) ? contents : contents + BLOCK;
}

function withKotlinMetadataCheck(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy')
      throw new Error('withKotlinMetadataCheck: expected a Groovy build.gradle');
    cfg.modResults.contents = patch(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withKotlinMetadataCheck;
module.exports.patch = patch;
module.exports.MARKER = MARKER;
