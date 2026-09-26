/**
 * The settle sheet. Its states are the settle state machine's, one-to-one.
 * Green happens once, and only when RevenueCat says so.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Press, T } from '../components/ui';
import { settleOneAd } from '../ads/settle';
import type { SettleState } from '../ads/settleState';
import { openProPaywall } from '../paywall/open';
import { useApp } from '../state/AppContext';
import { color, radius, space } from '../theme/tokens';

export function SettleSheet({
  visible,
  onClose,
  onContinue,
}: {
  visible: boolean;
  onClose: () => void;
  onContinue?: () => void;
}) {
  const { t, adsBalance, refreshBalance, refreshInfo, logSettle, rcConfigured, isPro } = useApp();
  const [state, setState] = useState<SettleState>('idle');
  const [shownBalance, setShownBalance] = useState(adsBalance);
  const [proBusy, setProBusy] = useState(false);
  /** Shown under the Pro button when there is nothing to sell yet, or the paywall failed. */
  const [proNote, setProNote] = useState<string | null>(null);
  const tick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setState('idle');
      setShownBalance(adsBalance);
      setProNote(null);
    }
  }, [visible, adsBalance]);

  useEffect(() => {
    if (state !== 'settled') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.timing(tick, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    const id = setTimeout(onClose, 900);
    return () => clearTimeout(id);
  }, [state, tick, onClose]);

  const watch = async () => {
    if (!rcConfigured) return;
    setProNote(null);
    let final: SettleState;
    try {
      final = await settleOneAd(adsBalance, {
        onState: setState,
        onLog: (row) => {
          logSettle(row);
          if (row.balanceAfter !== null) setShownBalance(row.balanceAfter);
        },
      });
    } catch {
      // settleOneAd handles its own failures; this is the last guard against a stuck spinner.
      final = 'no_fill';
      setState(final);
    }
    // The pill is driven by the server balance — read it back regardless of outcome.
    await refreshBalance(final === 'settled');
  };

  const pro = async () => {
    if (!rcConfigured || proBusy) return;
    setProBusy(true);
    setProNote(null);
    try {
      const outcome = await openProPaywall();
      await refreshInfo();
      if (outcome === 'purchased') onClose();
      else if (outcome === 'unavailable') setProNote(t.settle.proUnavailable);
      else if (outcome === 'error') setProNote(t.settle.proError);
    } finally {
      setProBusy(false);
    }
  };

  const busy = state === 'loading' || state === 'playing' || state === 'verifying' || proBusy;
  const statusLine: Partial<Record<SettleState, string>> = {
    loading: t.settle.loading,
    playing: t.settle.playing,
    verifying: t.settle.verifying,
    settled: t.settle.settled,
    failed: t.settle.failed,
    no_fill: t.settle.noFill,
    closed_early: t.settle.closedEarly,
  };
  const statusColor =
    state === 'settled'
      ? color.settled
      : state === 'failed' || state === 'no_fill' || state === 'closed_early'
        ? color.danger
        : color.muted;

  return (
    <Modal
      visible={visible && !isPro}
      transparent
      animationType="slide"
      onRequestClose={busy ? undefined : onClose}
    >
      <Pressable
        style={s.scrim}
        onPress={busy ? undefined : onClose}
        accessibilityLabel={t.settle.later}
      />
      <View style={s.sheet}>
        <View style={s.row}>
          <T variant="title" style={{ flex: 1 }}>
            {t.settle.title}
          </T>
          <Animated.Text
            style={[
              s.counter,
              {
                color: tick.interpolate({
                  inputRange: [0, 1],
                  outputRange: [color.owed, color.settled],
                }),
              },
            ]}
          >
            ADS {shownBalance}
          </Animated.Text>
        </View>
        <T variant="muted" style={{ marginTop: space.xs, marginBottom: space.md }}>
          {t.settle.subtitle}
        </T>
        {!rcConfigured ? (
          <T variant="caption" style={{ color: color.danger, marginBottom: space.sm }}>
            {t.settings.noKey}
          </T>
        ) : null}
        <Button
          label={t.settle.watch}
          tone={state === 'settled' ? 'settled' : 'owed'}
          onPress={watch}
          disabled={busy || state === 'settled' || !rcConfigured}
          loading={busy}
        />
        {statusLine[state] ? (
          <T
            variant="muted"
            style={{ color: statusColor, textAlign: 'center', marginTop: space.sm }}
          >
            {statusLine[state]}
          </T>
        ) : null}
        <Button
          label={t.settle.pro}
          tone="surface"
          onPress={pro}
          disabled={busy || !rcConfigured}
          loading={proBusy}
        />
        {proNote ? (
          <T
            variant="muted"
            style={{ color: color.danger, textAlign: 'center', marginTop: space.sm }}
            accessibilityLiveRegion="polite"
          >
            {proNote}
          </T>
        ) : null}
        {state === 'no_fill' && onContinue ? (
          <Press
            tone="ghost"
            onPress={onContinue}
            style={{ alignSelf: 'center', marginTop: space.sm }}
            accessibilityRole="button"
          >
            <T variant="muted" style={{ textDecorationLine: 'underline' }}>
              {t.settle.continue}
            </T>
          </Press>
        ) : (
          <Press
            tone="ghost"
            onPress={onClose}
            disabled={busy}
            style={{ alignSelf: 'center', marginTop: space.sm }}
            accessibilityRole="button"
          >
            <T variant="muted">{t.settle.later}</T>
          </Press>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: space.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  counter: { fontFamily: 'monospace', fontSize: 18 },
});
