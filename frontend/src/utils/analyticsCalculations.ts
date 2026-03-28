import type { Trade } from '@/types';
import { calculatePL } from './tradeCalculations';

export interface Metrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPL: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  sharpeRatio: number;
}

export interface EquityCurvePoint {
  trade: number;
  balance: number;
  date: string;
}

export interface DayStats {
  day: string;
  wins: number;
  losses: number;
  total: number;
}

export interface TagStats {
  tag: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface StrategyStats {
  strategy: string;
  wins: number;
  losses: number;
  total: number;
  totalPL: number;
  winRate: number;
  avgPL: number;
}

export function calculateMetrics(trades: Trade[]): Metrics {
  const closed = trades.filter(
    (t) => t.exitPrice != null && t.entryPrice != null && t.positionSize != null,
  );
  const total = closed.length;
  const winners = closed.filter((t) => calculatePL(t) > 0);
  const losers = closed.filter((t) => calculatePL(t) < 0);

  const winRate = total > 0 ? (winners.length / total) * 100 : 0;
  const totalPL = closed.reduce((s, t) => s + calculatePL(t), 0);

  const averageWin =
    winners.length > 0
      ? winners.reduce((s, t) => s + calculatePL(t), 0) / winners.length
      : 0;
  const averageLoss =
    losers.length > 0
      ? losers.reduce((s, t) => s + calculatePL(t), 0) / losers.length
      : 0;

  const grossProfit = winners.reduce((s, t) => s + calculatePL(t), 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + calculatePL(t), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

  const expectancy =
    total > 0
      ? (winRate / 100) * averageWin + ((100 - winRate) / 100) * averageLoss
      : 0;

  let sharpeRatio = 0;
  if (total > 1) {
    const returns = closed.map((t) => calculatePL(t));
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance =
      returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    sharpeRatio = stdDev > 0 ? mean / stdDev : 0;
  }

  return {
    totalTrades: total,
    winningTrades: winners.length,
    losingTrades: losers.length,
    winRate,
    totalPL,
    averageWin,
    averageLoss,
    profitFactor,
    expectancy,
    sharpeRatio,
  };
}

export function calculateMaxDrawdown(
  curve: { balance: number }[],
): { maxDD: number; maxDDPct: number } {
  let peak = curve[0]?.balance ?? 0;
  let maxDD = 0;
  let peakAtDD = peak;

  for (const point of curve) {
    if (point.balance > peak) peak = point.balance;
    const dd = peak - point.balance;
    if (dd > maxDD) {
      maxDD = dd;
      peakAtDD = peak;
    }
  }
  const maxDDPct = peakAtDD > 0 ? (maxDD / peakAtDD) * 100 : 0;
  return { maxDD, maxDDPct };
}

export function getEquityCurve(
  trades: Trade[],
  initialBalance: number,
): EquityCurvePoint[] {
  const closed = trades
    .filter(
      (t) =>
        t.exitPrice != null && t.entryPrice != null && t.positionSize != null,
    )
    .sort(
      (a, b) =>
        new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime(),
    );

  let running = initialBalance;
  const curve: EquityCurvePoint[] = [
    { trade: 0, balance: initialBalance, date: 'Start' },
  ];

  closed.forEach((trade, idx) => {
    running += calculatePL(trade);
    curve.push({
      trade: idx + 1,
      balance: running,
      date: new Date(trade.closedAt!).toLocaleDateString(),
    });
  });

  return curve;
}

export function getTradesByDay(trades: Trade[]): DayStats[] {
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];
  const stats = days.map((day) => ({ day, wins: 0, losses: 0, total: 0 }));

  trades.forEach((trade) => {
    const dayIdx = new Date(trade.openedAt).getDay();
    stats[dayIdx].total++;
    if (
      trade.exitPrice != null &&
      trade.entryPrice != null &&
      trade.positionSize != null
    ) {
      const pl = calculatePL(trade);
      if (pl > 0) stats[dayIdx].wins++;
      else if (pl < 0) stats[dayIdx].losses++;
    }
  });

  return stats;
}

export function getTradesByTag(trades: Trade[]): TagStats[] {
  const tagMap = new Map<
    string,
    { wins: number; losses: number; total: number }
  >();

  trades.forEach((trade) => {
    if (!trade.tags) return;
    trade.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((tag) => {
        if (!tagMap.has(tag))
          tagMap.set(tag, { wins: 0, losses: 0, total: 0 });
        const s = tagMap.get(tag)!;
        s.total++;
        if (
          trade.exitPrice != null &&
          trade.entryPrice != null &&
          trade.positionSize != null
        ) {
          const pl = calculatePL(trade);
          if (pl > 0) s.wins++;
          else if (pl < 0) s.losses++;
        }
      });
  });

  return Array.from(tagMap.entries())
    .map(([tag, s]) => ({
      tag,
      ...s,
      winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

export function getTradesByStrategy(trades: Trade[]): StrategyStats[] {
  const map = new Map<
    string,
    { wins: number; losses: number; total: number; totalPL: number }
  >();
  map.set('No Strategy', { wins: 0, losses: 0, total: 0, totalPL: 0 });

  trades.forEach((trade) => {
    const name = trade.playbookTitle || 'No Strategy';
    if (!map.has(name))
      map.set(name, { wins: 0, losses: 0, total: 0, totalPL: 0 });
    const s = map.get(name)!;
    if (
      trade.exitPrice != null &&
      trade.entryPrice != null &&
      trade.positionSize != null
    ) {
      s.total++;
      const pl = calculatePL(trade);
      s.totalPL += pl;
      if (pl > 0) s.wins++;
      else if (pl < 0) s.losses++;
    }
  });

  return Array.from(map.entries())
    .map(([strategy, s]) => ({
      strategy,
      ...s,
      winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0,
      avgPL: s.total > 0 ? s.totalPL / s.total : 0,
    }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);
}
