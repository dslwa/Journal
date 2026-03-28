import { useEffect, useState } from 'react';
import { apiListTrades, apiMe } from '@/api/client';
import type { Trade } from '@/types';
import Layout from '@/components/layout/Layout';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  calculateMetrics, calculateMaxDrawdown, getEquityCurve,
  getTradesByDay, getTradesByTag, getTradesByStrategy,
} from '@/utils/analyticsCalculations';

const GRID = '#2d3748';
const AXIS = '#6b7280';
const tooltipStyle = { background: '#16191f', border: '1px solid #2d3748', borderRadius: 8, color: '#e2e8f0' };

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialBalance, setInitialBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, m] = await Promise.all([apiListTrades(), apiMe()]);
        setTrades(t.data);
        setInitialBalance(m.data.initialBalance ?? 0);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Comprehensive analysis of your trading performance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[90px] bg-panel rounded-xl border border-border-primary animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  const metrics = calculateMetrics(trades);
  const equityCurve = getEquityCurve(trades, initialBalance);
  const { maxDD, maxDDPct } = calculateMaxDrawdown(equityCurve);
  const tradesByDay = getTradesByDay(trades);
  const tradesByTag = getTradesByTag(trades);
  const tradesByStrategy = getTradesByStrategy(trades);

  if (metrics.totalTrades === 0) {
    return (
      <Layout>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Comprehensive analysis of your trading performance</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-600 mb-4">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <div className="text-base font-medium text-slate-300 mb-1">No data to analyze</div>
          <div className="text-sm text-slate-500">Add some trades to see your analytics dashboard</div>
        </div>
      </Layout>
    );
  }

  const metricCards: [string, string, string][] = [
    ['Total Trades', String(metrics.totalTrades), ''],
    ['Win Rate', `${metrics.winRate.toFixed(1)}%`, metrics.winRate >= 50 ? 'text-success' : 'text-danger'],
    ['Total P/L', `${metrics.totalPL >= 0 ? '+' : ''}${metrics.totalPL.toFixed(2)}`, metrics.totalPL >= 0 ? 'text-success' : 'text-danger'],
    ['Profit Factor', metrics.profitFactor.toFixed(2), metrics.profitFactor >= 1 ? 'text-success' : 'text-danger'],
    ['Avg Win', `+${metrics.averageWin.toFixed(2)}`, 'text-success'],
    ['Avg Loss', metrics.averageLoss.toFixed(2), 'text-danger'],
    ['Expectancy', `${metrics.expectancy >= 0 ? '+' : ''}${metrics.expectancy.toFixed(2)}`, metrics.expectancy >= 0 ? 'text-success' : 'text-danger'],
    ['Max Drawdown', `-${maxDD.toFixed(2)} (${maxDDPct.toFixed(1)}%)`, 'text-danger'],
    ['Sharpe Ratio', metrics.sharpeRatio.toFixed(2), metrics.sharpeRatio >= 1 ? 'text-success' : metrics.sharpeRatio >= 0 ? 'text-slate-400' : 'text-danger'],
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Analytics Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Comprehensive analysis of your trading performance</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metricCards.map(([label, value, color]) => (
          <div key={label} className="bg-panel rounded-xl border border-border-primary p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-bold ${color || 'text-slate-100'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Equity curve */}
      {equityCurve.length > 1 && (
        <div className="bg-panel rounded-xl border border-border-primary p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="trade" stroke={AXIS} />
              <YAxis stroke={AXIS} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {tradesByDay.some(d => d.total > 0) && (
          <div className="bg-panel rounded-xl border border-border-primary p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Trades by Day of Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tradesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="day" stroke={AXIS} />
                <YAxis stroke={AXIS} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="wins" fill="#10b981" />
                <Bar dataKey="losses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-panel rounded-xl border border-border-primary p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[{ name: 'Wins', value: metrics.winningTrades }, { name: 'Losses', value: metrics.losingTrades }]}
                cx="50%" cy="50%" labelLine={false}
                label={entry => `${entry.name}: ${entry.value}`}
                outerRadius={80} dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategy performance */}
      {tradesByStrategy.length > 0 && (
        <div className="bg-panel rounded-xl border border-border-primary p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Performance by Strategy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tradesByStrategy.map((item, idx) => (
              <div key={idx} className="bg-surface rounded-lg border border-border-primary p-4">
                <div className="text-sm font-semibold text-slate-100 mb-3">{item.strategy}</div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-slate-500">Win Rate</span>
                    <div className={`font-bold ${item.winRate >= 50 ? 'text-success' : 'text-danger'}`}>{item.winRate.toFixed(1)}%</div>
                  </div>
                  <div><span className="text-slate-500">Trades</span><div className="font-bold text-slate-100">{item.total}</div></div>
                  <div><span className="text-slate-500">W/L</span>
                    <div className="font-bold"><span className="text-success">{item.wins}</span> / <span className="text-danger">{item.losses}</span></div>
                  </div>
                  <div><span className="text-slate-500">Avg P/L</span>
                    <div className={`font-bold ${item.avgPL >= 0 ? 'text-success' : 'text-danger'}`}>{item.avgPL >= 0 ? '+' : ''}{item.avgPL.toFixed(2)}</div>
                  </div>
                </div>
                <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.winRate >= 50 ? 'bg-success' : 'bg-danger'}`} style={{ width: `${item.winRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag performance */}
      {tradesByTag.length > 0 && (
        <div className="bg-panel rounded-xl border border-border-primary overflow-hidden">
          <div className="px-5 py-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-slate-100">Performance by Tag/Setup</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary">
                  {['Tag', 'Total', 'Wins', 'Losses', 'Win Rate'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {tradesByTag.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3 font-medium text-brand">{item.tag}</td>
                    <td className="px-4 py-3 text-slate-300">{item.total}</td>
                    <td className="px-4 py-3 text-success">{item.wins}</td>
                    <td className="px-4 py-3 text-danger">{item.losses}</td>
                    <td className={`px-4 py-3 font-semibold ${item.winRate >= 50 ? 'text-success' : 'text-danger'}`}>
                      {item.winRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
