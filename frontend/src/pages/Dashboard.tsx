import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import BalanceModal from '@/components/ui/BalanceModal';
import type { Trade, UUID } from '@/types';
import { apiMe, apiListTrades, apiDeleteTrade, apiUpdateBalance, type MeResponse } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { calculatePL, isShortTrade } from '@/utils/tradeCalculations';
import { formatDate } from '@/utils/formatters';

type SortKey = 'date' | 'ticker' | 'pl' | 'size';

export default function Dashboard() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState<Trade | undefined>();
  const [newOpen, setNewOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'long' | 'short'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'be'>('all');

  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const reload = async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([apiMe(), apiListTrades()]);
      setMe(m.data);
      setTrades(t.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => {
    const initialBalance = me?.initialBalance ?? 10000;
    if (!trades.length) return { totalPL: 0, winRate: 0, totalTrades: 0, wins: 0, losses: 0, currentBalance: initialBalance, initialBalance };

    let totalPL = 0, wins = 0, losses = 0;
    for (const tr of trades) {
      const pl = calculatePL(tr);
      totalPL += pl;
      if (pl > 0) wins++;
      else if (pl < 0) losses++;
    }

    return {
      totalPL, winRate: Math.round((wins / trades.length) * 100),
      totalTrades: trades.length, wins, losses,
      currentBalance: initialBalance + totalPL, initialBalance,
    };
  }, [trades, me]);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.ticker.toLowerCase().includes(q) && !t.notes?.toLowerCase().includes(q)) return false;
      }
      if (directionFilter !== 'all') {
        const short = isShortTrade(t);
        if (directionFilter === 'long' && short) return false;
        if (directionFilter === 'short' && !short) return false;
      }
      if (resultFilter !== 'all') {
        const pl = calculatePL(t);
        if (resultFilter === 'win' && pl <= 0) return false;
        if (resultFilter === 'loss' && pl >= 0) return false;
        if (resultFilter === 'be' && pl !== 0) return false;
      }
      return true;
    });
  }, [trades, searchQuery, directionFilter, resultFilter]);

  const sortedTrades = useMemo(() => {
    const sorted = [...filteredTrades];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date': cmp = (a.openedAt ?? '').localeCompare(b.openedAt ?? ''); break;
        case 'ticker': cmp = a.ticker.localeCompare(b.ticker); break;
        case 'pl': cmp = calculatePL(a) - calculatePL(b); break;
        case 'size': cmp = (a.positionSize ?? 0) - (b.positionSize ?? 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredTrades, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'ticker' ? 'asc' : 'desc'); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' \u21C5';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  const onSaved = async () => { await reload(); showToast('Trade saved'); };

  const onDeleted = async (id: UUID) => {
    const confirmed = await confirm({ title: 'Delete Trade?', message: 'This will permanently delete this trade and its attachments.', confirmText: 'Delete', confirmVariant: 'danger' });
    if (!confirmed) return;
    try { await apiDeleteTrade(id); await reload(); showToast('Trade deleted'); }
    catch { showToast('Failed to delete trade', 'error'); }
  };

  const updateBalance = async (newBalance: number) => {
    const res = await apiUpdateBalance(newBalance);
    setMe(res.data);
    showToast('Balance updated');
  };

  const hasActiveFilters = searchQuery || directionFilter !== 'all' || resultFilter !== 'all';

  return (
    <Layout>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">
          {loading ? 'Loading...' : me ? `Welcome back, ${me.username}!` : 'Welcome!'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">Track and analyze your trading performance</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[120px] bg-panel rounded-xl border border-border-primary animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Balance card */}
          <div className="bg-panel rounded-xl border border-border-primary p-5">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Account Balance</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-100">${stats.currentBalance.toFixed(2)}</span>
              <span className={stats.totalPL >= 0 ? 'text-success text-sm' : 'text-danger text-sm'}>
                {stats.totalPL >= 0 ? '\u2191' : '\u2193'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">Started: ${stats.initialBalance.toFixed(2)}</span>
              <button
                className="text-xs text-brand hover:text-brand-hover font-medium"
                onClick={() => setBalanceModalOpen(true)}
              >
                Edit
              </button>
            </div>
          </div>

          <StatCard
            label="Total P&L"
            value={`${stats.totalPL >= 0 ? '+' : ''}$${stats.totalPL.toFixed(2)}`}
            subtitle={`${stats.totalTrades} trades`}
            trend={stats.totalPL >= 0 ? 'up' : 'down'}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate}%`}
            subtitle={`${stats.wins}W / ${stats.losses}L`}
            trend={stats.winRate >= 50 ? 'up' : 'down'}
          />

          {/* Add trade card */}
          <div className="bg-panel rounded-xl border border-border-primary border-dashed flex items-center justify-center p-5">
            <button
              className="flex items-center gap-2 px-5 py-3 bg-brand text-white rounded-lg font-semibold text-sm hover:bg-brand-hover transition-colors"
              onClick={() => setNewOpen(true)}
            >
              <span className="text-lg leading-none">+</span>
              Add New Trade
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {!loading && trades.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            className="flex-1 min-w-[200px] bg-surface border border-border-primary text-slate-100 px-3.5 py-2
              rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
            placeholder="Search ticker or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className="bg-surface border border-border-primary text-slate-100 px-3 py-2 rounded-lg text-sm outline-none
              focus:border-brand focus:ring-2 focus:ring-brand/15"
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value as typeof directionFilter)}
          >
            <option value="all">All Directions</option>
            <option value="long">Long Only</option>
            <option value="short">Short Only</option>
          </select>
          <select
            className="bg-surface border border-border-primary text-slate-100 px-3 py-2 rounded-lg text-sm outline-none
              focus:border-brand focus:ring-2 focus:ring-brand/15"
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value as typeof resultFilter)}
          >
            <option value="all">All Results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="be">Break-even</option>
          </select>
          {hasActiveFilters && (
            <button
              className="text-sm text-slate-400 hover:text-slate-200 px-3 py-2"
              onClick={() => { setSearchQuery(''); setDirectionFilter('all'); setResultFilter('all'); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Trades table */}
      <div className="bg-panel rounded-xl border border-border-primary overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
          <h2 className="text-base font-semibold text-slate-100">Recent Trades</h2>
          <span className="text-xs font-medium text-slate-400 bg-surface-secondary px-2.5 py-1 rounded-full">
            {filteredTrades.length} trades
          </span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-secondary rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary text-left">
                  {[
                    { key: 'date' as SortKey, label: 'Date' },
                    { key: 'ticker' as SortKey, label: 'Ticker' },
                    { key: null, label: 'Direction' },
                    { key: null, label: 'Entry' },
                    { key: null, label: 'Exit' },
                    { key: 'size' as SortKey, label: 'Size' },
                    { key: 'pl' as SortKey, label: 'P&L' },
                    { key: null, label: 'Result' },
                    { key: null, label: 'Files' },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap
                        ${col.key ? 'cursor-pointer hover:text-slate-200 select-none' : ''}`}
                      onClick={col.key ? () => toggleSort(col.key!) : undefined}
                    >
                      {col.label}{col.key ? sortIcon(col.key) : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {sortedTrades.map(t => {
                  const pl = calculatePL(t);
                  const short = isShortTrade(t);
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-surface-secondary/50 cursor-pointer transition-colors"
                      onClick={() => setOpened(t)}
                    >
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDate(t.openedAt)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-100">{t.ticker}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase
                          ${short ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'}`}>
                          {short ? 'SHORT' : 'LONG'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">${t.entryPrice?.toFixed(2) ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-300">${t.exitPrice?.toFixed(2) ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{t.positionSize ?? '-'}</td>
                      <td className={`px-4 py-3 font-semibold ${pl > 0 ? 'text-success' : pl < 0 ? 'text-danger' : 'text-slate-400'}`}>
                        {pl > 0 ? '+' : ''}${pl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {pl > 0 && <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">WIN</span>}
                        {pl < 0 && <span className="text-xs font-bold text-danger bg-danger/10 px-2 py-0.5 rounded">LOSS</span>}
                        {pl === 0 && <span className="text-xs font-bold text-slate-400 bg-surface-secondary px-2 py-0.5 rounded">BE</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400 bg-surface-secondary px-2 py-0.5 rounded-full">
                          {t.attachments?.length ?? 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!filteredTrades.length && !loading && (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-600 mb-4">
                          <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                        <div className="text-base font-medium text-slate-300 mb-1">
                          {trades.length > 0 ? 'No trades match filters' : 'No trades yet'}
                        </div>
                        <div className="text-sm text-slate-500 mb-4">
                          {trades.length > 0 ? 'Try adjusting your search or filters' : 'Add your first trade to start tracking'}
                        </div>
                        {trades.length === 0 && (
                          <button
                            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors"
                            onClick={() => setNewOpen(true)}
                          >
                            + Add First Trade
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals - TradeModal will be added in a later branch */}
      {balanceModalOpen && (
        <BalanceModal
          currentBalance={stats.initialBalance}
          onClose={() => setBalanceModalOpen(false)}
          onSave={updateBalance}
        />
      )}
    </Layout>
  );
}

function StatCard({ label, value, subtitle, trend }: {
  label: string; value: string; subtitle?: string; trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-panel rounded-xl border border-border-primary p-5">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-slate-100">{value}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-success text-sm' : 'text-danger text-sm'}>
            {trend === 'up' ? '\u2191' : '\u2193'}
          </span>
        )}
      </div>
      {subtitle && <div className="text-xs text-slate-500 mt-2">{subtitle}</div>}
    </div>
  );
}
