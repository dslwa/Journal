import type { Trade } from '@/types';

// Liczy P&L transakcji. Dla pozycji SHORT odwraca znak różnicy ceny,
// żeby spadek dawał dodatni zysk. Dla otwartych pozycji (brak exitPrice) zwraca 0
export function calculatePL(trade: Trade): number {
  let priceDiff = (trade.exitPrice ?? trade.entryPrice ?? 0) - (trade.entryPrice ?? 0);
  if (trade.direction === 'SHORT') priceDiff = -priceDiff;
  return priceDiff * (trade.positionSize ?? 0);
}

// Klasyfikuje wynik transakcji: win / loss / be (break-even)
export function tradeResult(pl: number): 'win' | 'loss' | 'be' {
  if (pl > 0) return 'win';
  if (pl < 0) return 'loss';
  return 'be';
}

// Pomocnicza — sprawdza czy transakcja jest pozycją krótką (SHORT)
export function isShortTrade(trade: Trade): boolean {
  return trade.direction === 'SHORT';
}
