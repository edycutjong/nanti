/**
 * Two brand colours = the two states of the tab (specs/ui.md):
 *   owed    #F2A93B  an ad is owed — the pill, "bayar nanti", the name
 *   settled #34D399  cleared — fires ONLY when pollRewardVerification returns a reward or `pro` activates
 * The letter is warm paper on ink; nothing else is coloured except the violet Pro chip.
 */
export const color = {
  plate: '#0F1419',
  surface: '#1A2027',
  surface2: '#242C36',
  paper: '#FFFDF7',
  ink: '#171B22',
  text: '#F3F4F6',
  muted: '#94A3B8',
  owed: '#F2A93B',
  settled: '#34D399',
  danger: '#F87171',
  pro: '#A78BFA',
  border: 'rgba(255,255,255,0.08)',
} as const;

export const font = {
  display: 'SpaceGrotesk_700Bold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_600SemiBold',
  mono: 'monospace',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const HIT = 44;
