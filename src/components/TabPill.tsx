/**
 * The pill IS the brand: amber = an ad is owed; green = settled (2 s, only
 * after RevenueCat verified it or `pro` activated); violet chip = Pro.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Press, T } from './ui';
import { useApp } from '../state/AppContext';
import { color, radius, space } from '../theme/tokens';

export function TabPill({ onPress }: { onPress: () => void }) {
  const { debt, isPro, t } = useApp();
  const [flash, setFlash] = useState(false);
  const prev = useRef(debt);
  const slide = useRef(new Animated.Value(debt === 1 ? 1 : 0)).current;

  useEffect(() => {
    if (prev.current === 1 && debt === 0) {
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(id);
    }
    prev.current = debt;
  }, [debt]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: debt === 1 || flash ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [debt, flash, slide]);

  if (isPro)
    return (
      <T variant="caption" style={s.pro}>
        {t.pill.pro}
      </T>
    );
  if (debt === 0 && !flash) return null;
  return (
    <Animated.View
      style={{
        opacity: slide,
        transform: [
          { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
        ],
      }}
    >
      <Press
        tone="ghost"
        onPress={onPress}
        style={[s.pill, flash ? s.settled : s.owed]}
        accessibilityRole="button"
        accessibilityLabel={flash ? t.pill.clear : t.pill.owed}
      >
        <T variant="bold" style={{ color: flash ? color.settled : color.owed }}>
          {flash ? `✓ ${t.pill.clear}` : t.pill.owed}
        </T>
      </Press>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginTop: space.sm,
  },
  owed: { borderColor: color.owed },
  settled: { borderColor: color.settled },
  pro: {
    alignSelf: 'flex-start',
    color: color.ink,
    backgroundColor: color.pro,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: space.sm,
    fontFamily: 'Inter_600SemiBold',
  },
});
