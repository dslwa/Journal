import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import TradeModal from "@/components/TradeModal";
import TradesTable from "@/components/TradesTable";
import type { Trade, Playbook, UUID } from "@/types";
import {
  apiListTrades,
  apiListPlaybook,
} from "@/api/client";
import { useToast } from "@/components/ToastProvider";
import { calculatePL, isShortTrade } from "@/utils/tradeCalculations";

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState<Trade | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);
  const { showToast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"all" | "long" | "short">("all");
  const [resultFilter, setResultFilter] = useState<"all" | "win" | "loss" | "be">("all");

  const reload = async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([apiListTrades(), apiListPlaybook()]);
      setTrades(t.data);
      setPlaybooks(p.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const stats = useMemo(() => {
    const initialBalance = 10000;
    if (!trades.length) return {
      totalPL: 0, winRate: 0, totalTrades: 0, wins: 0, losses: 0,
      currentBalance: initialBalance, initialBalance
    };

    let totalPL = 0;
    let wins = 0;
    let losses = 0;

    trades.forEach((tr) => {
      const pl = calculatePL(tr);
      totalPL += pl;
      if (pl > 0) wins++;
      else if (pl < 0) losses++;
    });

    return {
      totalPL, winRate: Math.round((wins / trades.length) * 100),
      totalTrades: trades.length, wins, losses,
      currentBalance: initialBalance + totalPL, initialBalance,
    };
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTicker = t.ticker.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        if (!matchTicker && !matchNotes) return false;
      }
      if (directionFilter !== "all") {
        if (directionFilter === "long" && t.direction === "SHORT") return false;
        if (directionFilter === "short" && t.direction === "LONG") return false;
      }
      if (resultFilter !== "all") {
        const pl = calculatePL(t);
        if (resultFilter === "win" && pl <= 0) return false;
        if (resultFilter === "loss" && pl >= 0) return false;
        if (resultFilter === "be" && pl !== 0) return false;
      }
      return true;
    });
  }, [trades, searchQuery, directionFilter, resultFilter]);

  const onSaved = async () => {
    await reload();
    showToast("Trade saved");
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">
          {loading ? "Loading..." : `Welcome back!`}
        </h1>
        <p className="page-subtitle">Track and analyze your trading performance</p>
      </div>

      {loading ? (
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          <div className="card stat-card animate-slide-up">
            <div className="stat-label">Account Balance</div>
            <div className="stat-value">
              ${stats.currentBalance.toFixed(2)}
              <span className={`stat-trend ${stats.totalPL >= 0 ? 'up' : 'down'}`}>
                {stats.totalPL >= 0 ? "↑" : "↓"}
              </span>
            </div>
            <div className="stat-subtitle stat-subtitle-row">
              <span>Started: ${stats.initialBalance.toFixed(2)}</span>
            </div>
          </div>
          <StatCard
            label="Total P&L"
            value={`${stats.totalPL >= 0 ? "+" : ""}$${stats.totalPL.toFixed(2)}`}
            subtitle={`${stats.totalTrades} trades`}
            trend={stats.totalPL >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate}%`}
            subtitle={`${stats.wins}W / ${stats.losses}L`}
            trend={stats.winRate >= 50 ? "up" : "down"}
          />
          <div className="card stat-card animate-slide-up add-trade-card">
            <button className="primary btn-add-trade" onClick={() => setNewOpen(true)}>
              <span className="btn-add-trade-icon">+</span>
              Add New Trade
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!loading && trades.length > 0 && (
        <div className="filter-bar">
          <input
            className="input"
            placeholder="Search ticker or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className="select"
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value as typeof directionFilter)}
          >
            <option value="all">All Directions</option>
            <option value="long">Long Only</option>
            <option value="short">Short Only</option>
          </select>
          <select
            className="select"
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value as typeof resultFilter)}
          >
            <option value="all">All Results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="be">Break-even</option>
          </select>
          {(searchQuery || directionFilter !== "all" || resultFilter !== "all") && (
            <button onClick={() => { setSearchQuery(""); setDirectionFilter("all"); setResultFilter("all"); }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      <TradesTable rows={filteredTrades} playbooks={playbooks} onSelect={setOpened} />

      {opened && (
        <TradeModal
          trade={opened}
          onClose={() => setOpened(undefined)}
          onSaved={onSaved}
          currentBalance={stats.currentBalance}
        />
      )}
      {newOpen && (
        <TradeModal
          onClose={() => setNewOpen(false)}
          onSaved={onSaved}
          currentBalance={stats.currentBalance}
        />
      )}
    </Layout>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  trend,
}: {
  label: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="card stat-card animate-slide-up">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {trend && (
          <span className={`stat-trend ${trend}`}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}
