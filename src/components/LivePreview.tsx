/** The same HTML string that feeds expo-print, rendered at A4 ratio in a WebView — exact to the PDF. */
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { color, radius } from '../theme/tokens';

export function LivePreview({ html }: { html: string }) {
  const { width } = useWindowDimensions();
  const w = width - 32;
  const h = Math.round(w * 1.414);
  // Scale the A4 page (794 css px wide at 96 dpi) into the card.
  const scale = w / 794;
  const scaled = html.replace(
    '<body>',
    `<body style="zoom:${scale.toFixed(3)}; padding: ${Math.round(113 / 1)}px ${Math.round(94)}px; box-sizing: border-box; min-height: 1123px; width: 794px; overflow: hidden;">`,
  );
  return (
    <View style={[s.card, { width: w, height: h }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: scaled }}
        scrollEnabled={false}
        scalesPageToFit={false}
        style={s.web}
        javaScriptEnabled={false}
        pointerEvents="none"
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: color.paper,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  web: { backgroundColor: color.paper, flex: 1 },
});
