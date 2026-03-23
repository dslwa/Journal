import { useEffect, useState } from "react";
import { apiListTrades, apiMe } from "@/api/client";
import type { Trade } from "@/types";
import Layout from "@/components/Layout";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const GRID_COLOR = "#2d3748";
const AXIS_COLOR = "#6b7280";

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tradesRes, meRes] = await Promise.all([
        apiListTrades(),
        apiMe()
      ]);
      setTrades(tradesRes.data);
      setInitialBalance(meRes.data.initialBalance ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const calculatePL = (trade: Trade) => {
    if (trade.exitPrice === null || trade.entryPrice === null || trade.positionSize === null) return 0;
    const isShort = trade.tags?.includes('Short');
    let priceDiff = trade.exitPrice - trade.entryPrice;
    if (isShort) priceDiff = -priceDiff;
    return priceDiff * trade.positionSize;
  };

  const calculateMetrics = () => {
    const closedTrades = trades.filter(t => t.exitPrice !== null && t.entryPrice !== null && t.positionSize !== null);
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => calculatePL(t) > 0);
    const losingTrades = closedTrades.filter(t => calculatePL(t) < 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const totalPL = closedTrades.reduce((sum, t) => sum + calculatePL(t), 0);
    const averageWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + calculatePL(t), 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + calculatePL(t), 0) / losingTrades.length : 0;

    // Standard profit factor: gross profit / gross loss
    const grossProfit = winningTrades.reduce((sum, t) => sum + calculatePL(t), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + calculatePL(t), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Expectancy: expected $ per trade
    const expectancy = totalTrades > 0
      ? (winRate / 100) * averageWin + ((100 - winRate) / 100) * averageLoss
      : 0;

    // Sharpe Ratio: mean return / stddev of returns
    let sharpeRatio = 0;
    if (totalTrades > 1) {
      const returns = closedTrades.map(t => calculatePL(t));
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      sharpeRatio = stdDev > 0 ? mean / stdDev : 0;
    }

    return { totalTrades, winningTrades: winningTrades.length, losingTrades: losingTrades.length, winRate, totalPL, averageWin, averageLoss, profitFactor, expectancy, sharpeRatio };
  };

  const calculateMaxDrawdown = (curve: { balance: number }[]) => {
    let peak = curve[0]?.balance ?? 0;
    let maxDD = 0;
    let peakAtDD = peak;
    for (const point of curve) {
      if (point.balance > peak) peak = point.balance;
      const dd = peak - point.balance;
      if (dd > maxDD) { maxDD = dd; peakAtDD = peak; }
    }
    const maxDDPct = peakAtDD > 0 ? (maxDD / peakAtDD) * 100 : 0;
    return { maxDD, maxDDPct };
  };

  const getEquityCurve = () => {
    const closedTrades = trades
      .filter(t => t.exitPrice !== null && t.entryPrice !== null && t.positionSize !== null)
      .sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime());
    let runningBalance = initialBalance;
    const curve = [{ trade: 0, balance: initialBalance, date: 'Start' }];
    closedTrades.forEach((trade, idx) => {
      runningBalance += calculatePL(trade);
      curve.push({ trade: idx + 1, balance: runningBalance, date: new Date(trade.closedAt!).toLocaleDateString() });
    });
    return curve;
  };

  const getTradesByDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.map(day => ({ day, wins: 0, losses: 0, total: 0 }));
    trades.forEach(trade => {
      const dayIndex = new Date(trade.openedAt).getDay();
      dayStats[dayIndex].total++;
      if (trade.exitPrice !== null && trade.entryPrice !== null && trade.positionSize !== null) {
        const pl = calculatePL(trade);
        if (pl > 0) dayStats[dayIndex].wins++;
        else if (pl < 0) dayStats[dayIndex].losses++;
      }
    });
    return dayStats;
  };

  const getTradesByTag = () => {
    const tagMap = new Map<string, { wins: number, losses: number, total: number }>();
    trades.forEach(trade => {
      if (!trade.tags) return;
      const tags = trade.tags.split(',').map(t => t.trim()).filter(Boolean);
      tags.forEach(tag => {
        if (!tagMap.has(tag)) tagMap.set(tag, { wins: 0, losses: 0, total: 0 });
        const stats = tagMap.get(tag)!;
        stats.total++;
        if (trade.exitPrice !== null && trade.entryPrice !== null && trade.positionSize !== null) {
          const pl = calculatePL(trade);
          if (pl > 0) stats.wins++;
          else if (pl < 0) stats.losses++;
        }
      });
    });
    return Array.from(tagMap.entries()).map(([tag, stats]) => ({
      tag, ...stats, winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
    })).sort((a, b) => b.total - a.total).slice(0, 10);
  };

  const getTradesByStrategy = () => {
    const strategyMap = new Map<string, { wins: number, losses: number, total: number, totalPL: number }>();
    strategyMap.set('No Strategy', { wins: 0, losses: 0, total: 0, totalPL: 0 });
    trades.forEach(trade => {
      const strategyName = trade.playbookTitle || 'No Strategy';
      if (!strategyMap.has(strategyName)) strategyMap.set(strategyName, { wins: 0, losses: 0, total: 0, totalPL: 0 });
      const stats = strategyMap.get(strategyName)!;
      if (trade.exitPrice !== null && trade.entryPrice !== null && trade.positionSize !== null) {
        stats.total++;
        const pl = calculatePL(trade);
        stats.totalPL += pl;
        if (pl > 0) stats.wins++;
        else if (pl < 0) stats.losses++;
      }
    });
    return Array.from(strategyMap.entries())
      .map(([strategy, stats]) => ({
        strategy, ...stats,
        winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        avgPL: stats.total > 0 ? stats.totalPL / stats.total : 0,
      }))
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total);
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Comprehensive analysis of your trading performance</p>
        </div>
        <div className="metrics-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
        <div className="skeleton skeleton-chart" style={{ marginBottom: 24 }} />
      </Layout>
    );
  }

  const metrics = calculateMetrics();
  const equityCurve = getEquityCurve();
  const { maxDD, maxDDPct } = calculateMaxDrawdown(equityCurve);
  const tradesByDay = getTradesByDay();
  const tradesByTag = getTradesByTag();
  const tradesByStrategy = getTradesByStrategy();

  if (metrics.totalTrades === 0) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Comprehensive analysis of your trading performance</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, opacity: 0.5 }}>
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div className="empty-state-title">No data to analyze</div>
          <div className="empty-state-text">Add some trades to see your analytics dashboard</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header animate-slide-up">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">Comprehensive analysis of your trading performance</p>
      </div>

      <div className="metrics-grid animate-slide-up">
        <div className="metric-card">
          <div className="metric-label">Total Trades</div>
          <div className="metric-value">{metrics.totalTrades}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Win Rate</div>
          <div className="metric-value" style={{ color: metrics.winRate >= 50 ? 'var(--success)' : 'var(--error)' }}>
            {metrics.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total P/L</div>
          <div className="metric-value" style={{ color: metrics.totalPL >= 0 ? 'var(--success)' : 'var(--error)' }}>
            {metrics.totalPL >= 0 ? '+' : ''}{metrics.totalPL.toFixed(2)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Profit Factor</div>
          <div className="metric-value" style={{ color: metrics.profitFactor >= 1 ? 'var(--success)' : 'var(--error)' }}>
            {metrics.profitFactor.toFixed(2)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Win</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>
            +{metrics.averageWin.toFixed(2)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Loss</div>
          <div className="metric-value" style={{ color: 'var(--error)' }}>
            {metrics.averageLoss.toFixed(2)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Expectancy</div>
          <div className="metric-value" style={{ color: metrics.expectancy >= 0 ? 'var(--success)' : 'var(--error)' }}>
            {metrics.expectancy >= 0 ? '+' : ''}{metrics.expectancy.toFixed(2)}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Max Drawdown</div>
          <div className="metric-value" style={{ color: 'var(--error)' }}>
            -{maxDD.toFixed(2)} ({maxDDPct.toFixed(1)}%)
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sharpe Ratio</div>
          <div className="metric-value" style={{ color: metrics.sharpeRatio >= 1 ? 'var(--success)' : metrics.sharpeRatio >= 0 ? 'var(--text-secondary)' : 'var(--error)' }}>
            {metrics.sharpeRatio.toFixed(2)}
          </div>
        </div>
      </div>

      {equityCurve.length > 1 && (
        <div className="chart-card animate-slide-up">
          <h3 className="chart-title">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="trade" stroke={AXIS_COLOR} />
              <YAxis stroke={AXIS_COLOR} />
              <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
              <Legend />
              <Line type="monotone" dataKey="balance" stroke="var(--brand)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid-2 animate-slide-up">
        {tradesByDay.some(d => d.total > 0) && (
          <div className="chart-card">
            <h3 className="chart-title">Trades by Day of Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tradesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="day" stroke={AXIS_COLOR} />
                <YAxis stroke={AXIS_COLOR} />
                <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                <Legend />
                <Bar dataKey="wins" fill="var(--success)" />
                <Bar dataKey="losses" fill="var(--error)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="chart-card">
          <h3 className="chart-title">Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Wins', value: metrics.winningTrades },
                  { name: 'Losses', value: metrics.losingTrades },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="var(--success)" />
                <Cell fill="var(--error)" />
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {tradesByStrategy.length > 0 && (
        <div className="chart-card animate-slide-up">
          <h3 className="chart-title">Performance by Strategy</h3>
          <div className="strategy-grid">
            {tradesByStrategy.map((item, idx) => (
              <div key={idx} className="strategy-card">
                <div className="strategy-header">
                  <div className="strategy-name">{item.strategy}</div>
                </div>
                <div className="strategy-stats">
                  <div>
                    <div className="strategy-stat-label">Win Rate</div>
                    <div className="strategy-stat-value" style={{ color: item.winRate >= 50 ? 'var(--success)' : 'var(--error)' }}>
                      {item.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="strategy-stat-label">Trades</div>
                    <div className="strategy-stat-value">{item.total}</div>
                  </div>
                  <div>
                    <div className="strategy-stat-label">W/L</div>
                    <div className="strategy-stat-value">
                      <span style={{ color: 'var(--success)' }}>{item.wins}</span>
                      {' / '}
                      <span style={{ color: 'var(--error)' }}>{item.losses}</span>
                    </div>
                  </div>
                  <div>
                    <div className="strategy-stat-label">Avg P/L</div>
                    <div className="strategy-stat-value" style={{ color: item.avgPL >= 0 ? 'var(--success)' : 'var(--error)' }}>
                      {item.avgPL >= 0 ? '+' : ''}{item.avgPL.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${item.winRate}%`,
                      background: item.winRate >= 50 ? 'var(--success)' : 'var(--error)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tradesByTag.length > 0 && (
        <div className="chart-card animate-slide-up">
          <h3 className="chart-title">Performance by Tag/Setup</h3>
          <div className="data-grid">
            <div className="data-grid-header">
              <div>Tag</div>
              <div>Total</div>
              <div>Wins</div>
              <div>Losses</div>
              <div>Win Rate</div>
            </div>
            {tradesByTag.map((item, idx) => (
              <div key={idx} className="data-grid-row">
                <div style={{ fontWeight: 500, color: 'var(--brand)' }}>{item.tag}</div>
                <div>{item.total}</div>
                <div style={{ color: 'var(--success)' }}>{item.wins}</div>
                <div style={{ color: 'var(--error)' }}>{item.losses}</div>
                <div style={{ color: item.winRate >= 50 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                  {item.winRate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
