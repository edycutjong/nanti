import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HIT, color, font, radius, space } from '../theme/tokens';

type Variant = 'display' | 'title' | 'body' | 'bold' | 'muted' | 'caption' | 'mono';
export function T({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return (
    <Text
      {...rest}
      style={[s.base, s[variant as Exclude<Variant, 'body'>] ?? null, style]}
      maxFontSizeMultiplier={1.3}
    />
  );
}

export function Press({
  style,
  children,
  tone = 'surface',
  disabled,
  ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'owed' | 'ghost' | 'settled';
  children: React.ReactNode;
}) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        s.press,
        s[`tone_${tone}`],
        style,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        disabled && { opacity: 0.4 },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Button({
  label,
  tone = 'owed',
  loading,
  ...rest
}: PressableProps & {
  label: string;
  tone?: 'owed' | 'surface' | 'ghost' | 'settled';
  loading?: boolean;
}) {
  const dark = tone === 'owed' || tone === 'settled';
  return (
    <Press
      tone={tone}
      {...rest}
      style={s.button}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={dark ? color.ink : color.text} />
      ) : (
        <T variant="bold" style={{ color: dark ? color.ink : color.text, textAlign: 'center' }}>
          {label}
        </T>
      )}
    </Press>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={[s.body, style]}>{children}</View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  base: { color: color.text, fontFamily: font.body, fontSize: 16, lineHeight: 22 },
  display: { fontFamily: font.display, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: font.display, fontSize: 24, lineHeight: 30 },
  bold: { fontFamily: font.bodyBold },
  muted: { color: color.muted, fontSize: 14, lineHeight: 20 },
  caption: { color: color.muted, fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: font.mono, fontSize: 14, lineHeight: 20, color: color.text },
  press: { minHeight: HIT, minWidth: HIT, justifyContent: 'center', borderRadius: radius.md },
  tone_surface: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  tone_owed: { backgroundColor: color.owed },
  tone_settled: { backgroundColor: color.settled },
  tone_ghost: { backgroundColor: 'transparent' },
  button: { paddingHorizontal: space.lg, paddingVertical: space.sm + 4, marginTop: space.sm },
  safe: { flex: 1, backgroundColor: color.plate },
  body: { flex: 1, paddingHorizontal: space.md, paddingTop: space.md },
});
