/** Restore · language · the RevenueCat receipt (live reads, last 5 settles) · honest counters. */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Press, Screen, T } from '../components/ui';
import { getAppUserId, restore } from '../rc/client';
import { recentSettles } from '../ledger/store';
import type { SettleLogRow } from '../ads/settle';
import { lettersMade } from '../ledger/tab';
import type { LocalePref } from '../i18n/t';
import { useApp } from '../state/AppContext';
import { color, space } from '../theme/tokens';

const LOCALES: { p: LocalePref; label: (auto: string) => string }[] = [
  { p: 'auto', label: (a) => a },
  { p: 'id', label: () => 'Indonesia' },
  { p: 'en', label: () => 'English' },
];

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const {
    t,
    localePref,
    setLocalePref,
    adsBalance,
    adsBalanceFresh,
    isPro,
    refreshBalance,
    refreshInfo,
    rcConfigured,
    ledger,
  } = useApp();
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState<SettleLogRow[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setRows(recentSettles(5));
    if (!rcConfigured) return;
    try {
      setUserId(await getAppUserId());
    } catch {
      /* not configured */
    }
    await Promise.all([refreshBalance(true), refreshInfo()]);
  }, [rcConfigured, refreshBalance, refreshInfo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const doRestore = async () => {
    setBusy(true);
    setNote(null);
    try {
      await restore();
      await refreshInfo();
      setNote(t.settings.restored);
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const d = (ms: number | null, from: number) =>
    ms === null ? '—' : `${((ms - from) / 1000).toFixed(1)}s`;

  return (
    <Screen>
      <View style={s.top}>
        <Press
          tone="ghost"
          onPress={onBack}
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel={t.form.back}
        >
          <T style={{ fontSize: 22 }}>←</T>
        </Press>
        <T variant="title">{t.settings.title}</T>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xl }}>
        <Button
          label={t.settings.restore}
          tone="surface"
          onPress={doRestore}
          disabled={!rcConfigured || busy}
          loading={busy}
        />
        {note ? <T variant="caption">{note}</T> : null}
        {!rcConfigured ? (
          <T variant="caption" style={{ color: color.danger }}>
            {t.settings.noKey}
          </T>
        ) : null}

        <T variant="muted" style={s.h}>
          {t.settings.language}
        </T>
        <View style={{ flexDirection: 'row' }}>
          {LOCALES.map((l) => (
            <Press
              key={l.p}
              tone={localePref === l.p ? 'owed' : 'surface'}
              onPress={() => setLocalePref(l.p)}
              style={s.opt}
              accessibilityRole="button"
            >
              <T variant="bold" style={{ color: localePref === l.p ? color.ink : color.text }}>
                {l.label(t.settings.auto)}
              </T>
            </Press>
          ))}
        </View>

        <T variant="muted" style={s.h}>
          {t.settings.receipt}
        </T>
        <View style={s.card}>
          <Row k={t.settings.balance} v={`${adsBalance}${adsBalanceFresh ? '' : ' (cache)'}`} />
          <Row
            k={t.settings.entitlement}
            v={isPro ? t.settings.active : t.settings.inactive}
            tone={isPro ? color.settled : undefined}
          />
          <Row k={t.settings.userId} v={userId ? `${userId.slice(0, 18)}…` : '—'} />
          <Row k={t.settings.letters} v={String(lettersMade(ledger))} />
          <Row k={t.settings.forgiven} v={String(ledger.forgiven)} />
          <Press
            tone="ghost"
            onPress={reload}
            style={{ alignSelf: 'flex-end' }}
            accessibilityRole="button"
          >
            <T variant="bold" style={{ color: color.owed }}>
              ⟳ {t.settings.refresh}
            </T>
          </Press>
        </View>

        <T variant="muted" style={s.h}>
          {t.settings.lastSettles}
        </T>
        {rows.length === 0 ? (
          <T variant="caption">—</T>
        ) : (
          rows.map((r) => (
            <T key={r.impressionId} variant="mono" style={{ marginBottom: space.xs }}>
              {r.impressionId.slice(0, 8)} · {r.outcome} · verify {d(r.tVerified, r.tEarned)} ·
              balance {d(r.tBalance, r.tEarned)} · {r.balanceBefore}→{r.balanceAfter ?? '—'}
            </T>
          ))
        )}

        <T variant="muted" style={s.h}>
          {t.settings.about}
        </T>
        <T variant="caption">{t.app.tagline}</T>
      </ScrollView>
    </Screen>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <View style={s.row}>
      <T variant="muted">{k}</T>
      <T variant="mono" style={{ color: tone ?? color.text }}>
        {v}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: space.sm },
  back: { width: 44, height: 44, alignItems: 'center', marginRight: space.sm },
  h: {
    marginTop: space.lg,
    marginBottom: space.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  opt: { paddingHorizontal: space.md, marginRight: space.sm },
  card: {
    backgroundColor: color.surface,
    borderRadius: 14,
    padding: space.md,
    borderWidth: 1,
    borderColor: color.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
});
