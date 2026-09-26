/**
 * App state: the ledger (SQLite), prefs, the live CustomerInfo, the ADS
 * balance (server read), locale. `debt` is derived here from
 * `ledger.exported` and `adsBalance` — never stored.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CustomerInfo } from 'react-native-purchases';
import { getLocales } from 'expo-localization';
import {
  debt as computeDebt,
  lettersMade,
  reduce,
  writerTier,
  type Ledger,
  type Transition,
} from '../ledger/tab';
import * as store from '../ledger/store';
import {
  configurePurchases,
  getCustomerInfo,
  isPro as proOf,
  onCustomerInfo,
  readAdsBalance,
  syncWriterAttributes,
} from '../rc/client';
import { resolveLocale, strings, type Locale, type LocalePref } from '../i18n/t';
import type { Strings } from '../i18n/id';
import type { SettleLogRow } from '../ads/settle';

interface AppState {
  ready: boolean;
  rcConfigured: boolean;
  ledger: Ledger;
  adsBalance: number;
  /** null until the first server read succeeds; the pill paints from last_ads_seen meanwhile. */
  adsBalanceFresh: boolean;
  info: CustomerInfo | null;
  isPro: boolean;
  debt: 0 | 1;
  locale: Locale;
  localePref: LocalePref;
  t: Strings;
  lastCity: string;
  setLocalePref(p: LocalePref): void;
  setLastCity(c: string): void;
  /** The export table's verdict for the next export, without committing anything. */
  wouldBlockExport(adAvailable: boolean): boolean;
  /** Runs the export table; persists; syncs Targeting attributes. Call only once the PDF exists. */
  recordExport(adAvailable: boolean): Transition;
  refreshBalance(fresh?: boolean): Promise<number | null>;
  refreshInfo(): Promise<void>;
  logSettle(row: SettleLogRow): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [rcConfigured, setRcConfigured] = useState(false);
  const [ledger, setLedger] = useState<Ledger>({ exported: 0, forgiven: 0, proExports: 0 });
  const [adsBalance, setAdsBalance] = useState(0);
  const [adsBalanceFresh, setAdsBalanceFresh] = useState(false);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [localePref, setLocalePrefState] = useState<LocalePref>('auto');
  const [lastCity, setLastCityState] = useState('Jakarta');
  const deviceLang = getLocales()[0]?.languageCode ?? null;

  const refreshInfo = useCallback(async () => {
    try {
      setInfo(await getCustomerInfo());
    } catch {
      /* offline: keep the last known info */
    }
  }, []);

  const refreshBalance = useCallback(async (fresh = false) => {
    try {
      const b = await readAdsBalance({ fresh });
      if (b !== null) {
        setAdsBalance(b);
        setAdsBalanceFresh(true);
        store.savePrefs({ lastAdsSeen: b });
      }
      return b;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let off = () => {};
    const { ledger: l, prefs } = store.load();
    setLedger(l);
    setLocalePrefState(prefs.locale);
    setLastCityState(prefs.lastCity);
    setAdsBalance(prefs.lastAdsSeen);
    const configured = configurePurchases();
    setRcConfigured(configured);
    (async () => {
      if (configured) {
        off = onCustomerInfo(setInfo);
        await Promise.all([refreshInfo(), refreshBalance()]);
      }
      setReady(true);
    })();
    return () => off();
  }, [refreshInfo, refreshBalance]);

  const isPro = proOf(info);
  const debt = computeDebt(ledger, adsBalance);

  const recordExport = useCallback(
    (adAvailable: boolean) => {
      const t = reduce(ledger, adsBalance, { type: 'export', isPro, adAvailable });
      if (t.ledger !== ledger) {
        setLedger(t.ledger);
        store.saveLedger(t.ledger);
        if (rcConfigured) {
          const n = lettersMade(t.ledger);
          syncWriterAttributes(n, writerTier(n)).catch(() => {});
        }
      }
      return t;
    },
    [ledger, adsBalance, isPro, rcConfigured],
  );

  const wouldBlockExport = useCallback(
    (adAvailable: boolean) =>
      reduce(ledger, adsBalance, { type: 'export', isPro, adAvailable }).blocked,
    [ledger, adsBalance, isPro],
  );

  const setLocalePref = useCallback((p: LocalePref) => {
    setLocalePrefState(p);
    store.savePrefs({ locale: p });
  }, []);
  const setLastCity = useCallback((c: string) => {
    setLastCityState(c);
    store.savePrefs({ lastCity: c });
  }, []);
  const logSettle = useCallback((row: SettleLogRow) => store.appendSettle(row), []);

  const locale = resolveLocale(localePref, deviceLang);
  const value = useMemo<AppState>(
    () => ({
      ready,
      rcConfigured,
      ledger,
      adsBalance,
      adsBalanceFresh,
      info,
      isPro,
      debt,
      locale,
      localePref,
      t: strings(locale),
      lastCity,
      setLocalePref,
      setLastCity,
      wouldBlockExport,
      recordExport,
      refreshBalance,
      refreshInfo,
      logSettle,
    }),
    [
      ready,
      rcConfigured,
      ledger,
      adsBalance,
      adsBalanceFresh,
      info,
      isPro,
      debt,
      locale,
      localePref,
      lastCity,
      setLocalePref,
      setLastCity,
      wouldBlockExport,
      recordExport,
      refreshBalance,
      refreshInfo,
      logSettle,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
