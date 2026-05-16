export const theme = {
  bg: '#F1EFE9',
  canvas: '#F6F4EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F2EC',
  line: 'rgba(20,16,10,0.08)',
  lineStrong: 'rgba(20,16,10,0.14)',
  text: '#16140F',
  textMuted: 'rgba(22,20,15,0.58)',
  textFaint: 'rgba(22,20,15,0.38)',
  success: '#1F8A5B',
  danger: '#D04F3C',
  mapBg: '#EAE7DF',
  road: '#FFFFFF',
  roadShadow: 'rgba(0,0,0,0.04)',
  dot: 'rgba(20,16,10,0.10)',
  block: '#E0DDD2',
  base: '#3A5BD9',
  warm: '#F5A524',
} as const;

export type Theme = typeof theme;
