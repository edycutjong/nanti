/** 8 letter tiles + the tab pill. A tile tap with debt 1 (and not Pro) opens the Settle sheet instead of the form. */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Press, Screen, T } from '../components/ui';
import { TabPill } from '../components/TabPill';
import { TEMPLATES, type Template } from '../../packages/surat';
import { useApp } from '../state/AppContext';
import { color, space } from '../theme/tokens';

export function HomeScreen({
  graceArmed,
  onPick,
  onSettle,
  onSettings,
}: {
  graceArmed: boolean;
  onPick: (t: Template) => void;
  onSettle: () => void;
  onSettings: () => void;
}) {
  const { t, locale, debt, isPro } = useApp();
  return (
    <Screen>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <T variant="display">{t.app.name}</T>
          <T variant="muted">{t.app.tagline}</T>
          <TabPill onPress={onSettle} />
        </View>
        <Press
          tone="ghost"
          onPress={onSettings}
          style={s.gear}
          accessibilityRole="button"
          accessibilityLabel={t.home.settings}
        >
          <T style={{ fontSize: 22 }}>⚙︎</T>
        </Press>
      </View>
      <T variant="title" style={{ marginTop: space.lg, marginBottom: space.md }}>
        {t.home.title}
      </T>
      <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
        {TEMPLATES.map((tpl) => (
          <Press
            key={tpl.id}
            onPress={() => (debt === 1 && !isPro && !graceArmed ? onSettle() : onPick(tpl))}
            style={s.tile}
            accessibilityRole="button"
            accessibilityLabel={locale === 'id' ? tpl.title : tpl.subtitle}
          >
            <T style={{ fontSize: 28, lineHeight: 34 }}>{tpl.glyph}</T>
            <T variant="bold" style={{ marginTop: space.xs }}>
              {locale === 'id' ? tpl.title : tpl.subtitle}
            </T>
            <T variant="caption" numberOfLines={2}>
              {locale === 'id' ? tpl.subtitle : tpl.title}
            </T>
          </Press>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  gear: { width: 44, height: 44, alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: space.xl,
  },
  tile: {
    width: '48%',
    padding: space.md,
    marginBottom: space.sm + 4,
    minHeight: 132,
    justifyContent: 'flex-start',
    backgroundColor: color.surface,
  },
});
