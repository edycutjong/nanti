import type { ExpoConfig } from 'expo/config';

/**
 * The AdMob app id is read at prebuild time from the env (sourced from
 * ~/.config/nanti/secrets.env). Without it the config falls back to Google's
 * published SAMPLE app id so a dev build still compiles and serves test
 * creatives — but server-side verification cannot be enabled on the sample
 * unit, so every settle will (correctly) come back `failed` until the real
 * `settle_rewarded` unit is configured. Nothing in the app pretends otherwise.
 */
const ADMOB_SAMPLE_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config: ExpoConfig = {
  name: 'Nanti',
  slug: 'nanti',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'nanti',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0F1419',
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#0F1419' },
  android: {
    package: 'dev.edycu.nanti',
    versionCode: 1,
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#0F1419' },
    permissions: ['VIBRATE', 'com.android.vending.BILLING'],
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  plugins: [
    [
      'expo-build-properties',
      { android: { compileSdkVersion: 36, targetSdkVersion: 36, buildToolsVersion: '36.0.0' } },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: process.env.NANTI_ADMOB_APP_ID || ADMOB_SAMPLE_APP_ID,
        userTrackingUsageDescription: 'Used to show one rewarded ad per letter, after the letter.',
      },
    ],
    'expo-font',
    'expo-localization',
    'expo-sqlite',
    './plugins/withReleaseSigning',
    './plugins/withKotlinMetadataCheck',
  ],
};

export default config;
