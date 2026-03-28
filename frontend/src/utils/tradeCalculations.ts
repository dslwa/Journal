import type { Trade } from '@/types';

export function calculatePL(trade: Trade): number {
  let priceDiff = (trade.exitPrice ?? trade.entryPrice ?? 0) - (trade.entryPrice ?? 0);
  if (trade.direction === 'SHORT') priceDiff = -priceDiff;
  return priceDiff * (trade.positionSize ?? 0);
}

export function tradeResult(pl: number): 'win' | 'loss' | 'be' {
  if (pl > 0) return 'win';
  if (pl < 0) return 'loss';
  return 'be';
}

export function isShortTrade(trade: Trade): boolean {
  return trade.direction === 'SHORT';
}
