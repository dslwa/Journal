export const EMOTIONS = [
  { value: 'Confident', label: 'Confident', emoji: '\u{1F4AA}' },
  { value: 'Neutral', label: 'Neutral', emoji: '\u{1F610}' },
  { value: 'Anxious', label: 'Anxious', emoji: '\u{1F630}' },
  { value: 'Fearful', label: 'Fearful', emoji: '\u{1F628}' },
  { value: 'Greedy', label: 'Greedy', emoji: '\u{1F911}' },
  { value: 'Excited', label: 'Excited', emoji: '\u{1F525}' },
  { value: 'Frustrated', label: 'Frustrated', emoji: '\u{1F624}' },
  { value: 'Calm', label: 'Calm', emoji: '\u{1F9D8}' },
] as const;

export const IMPACT_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#94a3b8',
} as const;

export const POPULAR_TICKERS = [
  'NQ', 'EURUSD', 'AUDUSD', 'GBPUSD', 'USDCAD',
  'ES', 'YM', 'USDJPY', 'EURJPY', 'GBPJPY',
] as const;
