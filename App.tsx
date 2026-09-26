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
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

import { AppProvider, useApp } from './src/state/AppContext';
import { HomeScreen } from './src/screens/Home';
import { FormScreen } from './src/screens/Form';
import { SettleSheet } from './src/screens/SettleSheet';
import { SettingsScreen } from './src/screens/Settings';
import { initAds } from './src/ads/init';
import type { Template } from './packages/surat';
import { color } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = { name: 'home' } | { name: 'form'; template: Template } | { name: 'settings' };

function Root() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [settle, setSettle] = useState(false);
  // Armed ONLY by the settle sheet's no_fill state ("Lanjut dulu"). While armed, the next
  // tile tap opens the form instead of the sheet, and that export runs the grace row of the
  // ledger table (forgiven += 1, debt stays 1). Disarmed on export or on any Home navigation
  // back through the sheet. This is invariant I4: forgiven moves only after a real ad failure.
  const [graceArmed, setGraceArmed] = useState(false);
  useApp();

  // Android back returns form/settings to home instead of closing the app (found
  // on the emulator). The settle sheet is a Modal and handles back itself.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen.name === 'home') return false;
      setScreen({ name: 'home' });
      return true;
    });
    return () => sub.remove();
  }, [screen.name]);

  // UMP consent before the first ad request (EEA/UK policy), then the SDK init. Never blocks the
  // letter. Root renders only after AppProvider has run Purchases.configure (Gate waits on
  // app.ready), and settle.ts awaits this same memoised promise before any ad request.
  useEffect(() => {
    void initAds();
  }, []);

  switch (screen.name) {
    case 'form':
      return (
        <FormScreen
          template={screen.template}
          graceArmed={graceArmed}
          onBack={() => setScreen({ name: 'home' })}
          onExported={(blocked) => {
            setGraceArmed(false);
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
            graceArmed={graceArmed}
            onPick={(t) => setScreen({ name: 'form', template: t })}
            onSettle={() => setSettle(true)}
            onSettings={() => setScreen({ name: 'settings' })}
          />
          <SettleSheet
            visible={settle}
            onClose={() => setSettle(false)}
            onContinue={() => {
              // No ad could be served: let the next letter through anyway. The ledger records
              // it as forgiven when it is actually delivered (Form → recordExport(false)); the
              // tab stays at 1, never 2.
              setGraceArmed(true);
              setSettle(false);
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
