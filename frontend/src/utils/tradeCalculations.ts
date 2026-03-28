import type { Trade } from '@/types';

/** Calculate P&L for a trade based on direction (Long/Short) from tags */
export function calculatePL(trade: Trade): number {
  const isShort = trade.tags?.includes('Short') ?? false;
  let priceDiff =
    (trade.exitPrice ?? trade.entryPrice ?? 0) - (trade.entryPrice ?? 0);
  if (isShort) priceDiff = -priceDiff;
  return priceDiff * (trade.positionSize ?? 0);
}

export function tradeResult(pl: number): 'win' | 'loss' | 'be' {
  if (pl > 0) return 'win';
  if (pl < 0) return 'loss';
  return 'be';
}

export function isShortTrade(trade: Trade): boolean {
  return trade.tags?.includes('Short') ?? false;
}
