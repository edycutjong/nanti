/**
 * Five fields + the live paper preview; date and city auto-filled.
 * "Buat PDF" → the export table (src/ledger/tab.ts) → expo-print → share.
 * The letter is delivered BEFORE the tab is ever shown.
 */
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Press, Screen, T } from '../components/ui';
import { LivePreview } from '../components/LivePreview';
import {
  clampValues,
  formatHariTanggal,
  formatTanggal,
  isComplete,
  pdfFileName,
  type Template,
  type Values,
} from '../../packages/surat';
import { exportAndShare } from '../pdf/export';
import { rewardedUnitId } from '../ads/settle';
import { useApp } from '../state/AppContext';
import { color, font, radius, space } from '../theme/tokens';

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function FormScreen({
  template,
  onBack,
  onExported,
}: {
  template: Template;
  onBack: () => void;
  onExported: (blocked: boolean) => void;
}) {
  const { t, locale, lastCity, setLastCity, recordExport } = useApp();
  const [values, setValues] = useState<Values>(() => {
    const init: Values = {};
    for (const f of template.fields) {
      if (f.kind === 'pick' && f.options) init[f.key] = f.options[0];
      else if (f.kind === 'date') init[f.key] = formatHariTanggal(new Date());
      else init[f.key] = '';
    }
    return init;
  });
  const [kota, setKota] = useState(lastCity);
  const [editCity, setEditCity] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const ctx = useMemo(
    () => ({ kota: kota.trim() || 'Jakarta', tanggal: formatTanggal(today) }),
    [kota, today],
  );
  const html = useMemo(
    () => template.render(clampValues(template, values), ctx),
    [template, values, ctx],
  );
  const complete = isComplete(template, values);

  const make = async () => {
    if (!complete || busy) return;
    setBusy(true);
    setErr(null);
    try {
      // The tab rule decides first — but a BLOCKED export never happens here:
      // Home already routes a debt-1 tap to the Settle sheet, so this call is
      // either 'open-tab', 'grace' or 'pro-export'. adAvailable = we have a unit id.
      const transition = recordExport(!rewardedUnitId().isSample);
      if (transition.blocked) {
        onExported(true);
        return;
      }
      setLastCity(ctx.kota);
      await exportAndShare(html, pdfFileName(template, values, iso(today)), t.share.title);
      onExported(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <Press
            tone="ghost"
            onPress={onBack}
            style={s.back}
            accessibilityRole="button"
            accessibilityLabel={t.form.back}
          >
            <T style={{ fontSize: 22 }}>←</T>
          </Press>
          <T variant="title" style={{ flex: 1 }} numberOfLines={1}>
            {template.title}
          </T>
        </View>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <View style={s.chips}>
            {editCity ? (
              <TextInput
                value={kota}
                onChangeText={setKota}
                onBlur={() => setEditCity(false)}
                autoFocus
                style={[s.chip, s.chipInput]}
                placeholder="Jakarta"
                placeholderTextColor={color.muted}
                maxLength={40}
              />
            ) : (
              <Press
                tone="surface"
                onPress={() => setEditCity(true)}
                style={s.chip}
                accessibilityRole="button"
                accessibilityLabel={t.form.changeCity}
              >
                <T variant="muted">
                  {t.form.city}: <T variant="bold">{ctx.kota}</T>
                </T>
              </Press>
            )}
            <View style={[s.chip, { marginLeft: space.sm }]}>
              <T variant="muted">
                {t.form.date}: <T variant="bold">{ctx.tanggal}</T>
              </T>
            </View>
          </View>

          {template.fields.map((f) => (
            <View key={f.key} style={{ marginBottom: space.md }}>
              <T variant="muted" style={{ marginBottom: space.xs }}>
                {locale === 'id' ? f.label : `${f.labelEn} · ${f.label}`}
              </T>
              {f.kind === 'pick' && f.options ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {f.options.map((o) => (
                    <Press
                      key={o}
                      tone={values[f.key] === o ? 'owed' : 'surface'}
                      onPress={() => setValues({ ...values, [f.key]: o })}
                      style={s.opt}
                      accessibilityRole="button"
                    >
                      <T
                        variant="bold"
                        style={{ color: values[f.key] === o ? color.ink : color.text }}
                      >
                        {o}
                      </T>
                    </Press>
                  ))}
                </View>
              ) : (
                <TextInput
                  value={values[f.key]}
                  onChangeText={(v) => setValues({ ...values, [f.key]: v })}
                  placeholder={f.placeholder}
                  placeholderTextColor={color.muted}
                  multiline={f.kind === 'multiline'}
                  maxLength={f.maxLength}
                  style={[s.input, f.kind === 'multiline' && s.multiline]}
                />
              )}
            </View>
          ))}

          <T variant="caption" style={{ marginBottom: space.sm }}>
            {t.form.preview}
          </T>
          <LivePreview html={html} />
          <View style={{ height: 96 }} />
        </ScrollView>
        <View style={s.cta}>
          {err ? (
            <T variant="caption" style={{ color: color.danger, marginBottom: space.xs }}>
              {err}
            </T>
          ) : null}
          <Button
            label={busy ? t.form.making : t.form.cta}
            onPress={make}
            disabled={!complete || busy}
            loading={busy}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
  back: { width: 44, height: 44, alignItems: 'center', marginRight: space.sm },
  body: { paddingHorizontal: space.md },
  chips: { flexDirection: 'row', marginBottom: space.md },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    minHeight: 36,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    justifyContent: 'center',
  },
  chipInput: { color: color.text, fontFamily: font.body, minWidth: 140 },
  input: {
    backgroundColor: color.surface2,
    color: color.text,
    fontFamily: font.body,
    fontSize: 16,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    minHeight: 44,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  opt: { paddingHorizontal: space.md, marginRight: space.sm, marginBottom: space.sm },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.md,
    backgroundColor: color.plate,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
});
