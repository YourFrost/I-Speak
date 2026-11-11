import { useColorScheme } from 'react-native';

export interface Theme {
  bg: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  onPrimary: string;
  ok: string;
  warn: string;
  bad: string;
  border: string;
}

const light: Theme = {
  bg: '#faf8f5',
  card: '#ffffff',
  text: '#1d1b19',
  muted: '#6b665f',
  primary: '#2a5d4f',
  onPrimary: '#ffffff',
  ok: '#1f7a4d',
  warn: '#a86a00',
  bad: '#b3261e',
  border: '#e2ddd5',
};
const dark: Theme = {
  bg: '#141311',
  card: '#201e1b',
  text: '#f1ede7',
  muted: '#a49e95',
  primary: '#7cc3ad',
  onPrimary: '#0d1f1a',
  ok: '#6fd3a0',
  warn: '#f0b45a',
  bad: '#f2867e',
  border: '#35322d',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
