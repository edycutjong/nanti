/**
 * Nanti. One flow:
 *
 *   home ─(tile)─▶ form ─(Buat PDF)─▶ share sheet ─▶ home (pill: 1 ad owed)
 *     │                                              │
 *     └─(tile while owed / pill)─▶ settle sheet ◀────┘
 *                                    ├─ watch 1 ad → RevenueCat verifies → ADS +1 → pill clears
 *                                    └─ Nanti Pro → paywall @ tab_locked → pill gone for good
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

import { AppProvider, useApp } from './src/state/AppContext';
import { HomeScreen } from './src/screens/Home';
import { FormScreen } from './src/screens/Form';
import { SettleSheet } from './src/screens/SettleSheet';
import { SettingsScreen } from './src/screens/Settings';
import type { Template } from './packages/surat';
import { color } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = { name: 'home' } | { name: 'form'; template: Template } | { name: 'settings' };

function Root() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [settle, setSettle] = useState(false);
  const [pendingGrace, setPendingGrace] = useState<Template | null>(null);
  const app = useApp();

  // UMP consent before the first ad request (EEA/UK policy), then the SDK init. Never blocks the letter.
  useEffect(() => {
    (async () => {
      try {
        await AdsConsent.requestInfoUpdate();
        await AdsConsent.gatherConsent();
      } catch {
        /* consent unavailable — ads may no-fill; the tab's grace path covers it */
      }
      await mobileAds().initialize();
    })();
  }, []);

  switch (screen.name) {
    case 'form':
      return (
        <FormScreen
          template={screen.template}
          onBack={() => setScreen({ name: 'home' })}
          onExported={(blocked) => {
            setScreen({ name: 'home' });
            if (blocked) setSettle(true);
          }}
        />
      );
    case 'settings':
      return <SettingsScreen onBack={() => setScreen({ name: 'home' })} />;
    case 'home':
    default:
      return (
        <>
          <HomeScreen
            onPick={(t) => setScreen({ name: 'form', template: t })}
            onSettle={() => setSettle(true)}
            onSettings={() => setScreen({ name: 'settings' })}
          />
          <SettleSheet
            visible={settle}
            onClose={() => {
              setSettle(false);
              setPendingGrace(null);
            }}
            onContinue={() => {
              // No ad could be served: the letter is delivered anyway, the tab stays at 1 (never 2).
              setSettle(false);
              const next = pendingGrace ?? null;
              setPendingGrace(null);
              if (next) setScreen({ name: 'form', template: next });
              else app.recordExport(false);
            }}
          />
        </>
      );
  }
}

function Gate() {
  const app = useApp();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, SpaceGrotesk_700Bold });
  const ready = app.ready && fontsLoaded;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={color.owed} />
      </View>
    );
  return <Root />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" backgroundColor={color.plate} />
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: color.plate,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
