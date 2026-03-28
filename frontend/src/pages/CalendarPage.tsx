import { useEffect, useState } from 'react';
import { apiListTrades, apiGetMacroEvents } from '@/api/client';
import type { Trade, MacroEvent } from '@/types';
import Layout from '@/components/layout/Layout';
import { calculatePL } from '@/utils/tradeCalculations';
import { formatCurrency } from '@/utils/formatters';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { IMPACT_COLORS } from '@/constants';

export default function CalendarPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());

  useEffect(() => { loadTrades(); }, []);
  useEffect(() => { loadMacroEvents(); }, [currentDate]);
  useEscapeKey(selectedDay ? () => setSelectedDay(null) : null);

  const loadTrades = async () => {
    setLoading(true);
    try { const res = await apiListTrades(); setTrades(res.data); }
    finally { setLoading(false); }
  };

  const loadMacroEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const res = await apiGetMacroEvents(from, to);
      setMacroEvents(res.data);
    } catch { setMacroEvents([]); }
  };

  const allCountries = [...new Set(macroEvents.map(e => e.country).filter(Boolean))].sort() as string[];
  const filteredEvents = selectedCountries.size === 0 ? macroEvents : macroEvents.filter(e => e.country && selectedCountries.has(e.country));

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country); else next.add(country);
      return next;
    });
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.eventDate === dateStr);
  };

  const getHighestImpact = (events: MacroEvent[]) => {
    if (events.some(e => e.impact === 'High')) return 'High';
    if (events.some(e => e.impact === 'Medium')) return 'Medium';
    return 'Low';
  };

  const impactColor = (impact: string | null) => IMPACT_COLORS[impact ?? ''] ?? IMPACT_COLORS.Low;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  const getTradesForDay = (date: Date) =>
    trades.filter(t => {
      const d = new Date(t.openedAt);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });

  const getDayStats = (date: Date) => {
    const dayTrades = getTradesForDay(date);
    const closed = dayTrades.filter(t => t.exitPrice !== null && t.entryPrice !== null && t.positionSize !== null);
    const totalPL = closed.reduce((sum, t) => sum + calculatePL(t), 0);
    return { totalTrades: dayTrades.length, closedTrades: closed.length, totalPL, wins: closed.filter(t => calculatePL(t) > 0).length, losses: closed.filter(t => calculatePL(t) < 0).length };
  };

  const getDayColor = (date: Date) => {
    const s = getDayStats(date);
    if (s.closedTrades === 0) return s.totalTrades > 0 ? 'bg-slate-600' : '';
    if (s.totalPL > 0) return 'bg-success';
    if (s.totalPL < 0) return 'bg-danger';
    return 'bg-slate-600';
  };

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const selectedDayTrades = selectedDay ? getTradesForDay(selectedDay) : [];
  const selectedDayStats = selectedDay ? getDayStats(selectedDay) : null;
  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay).sort((a, b) => (a.country ?? '').localeCompare(b.country ?? '')) : [];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Trading Calendar</h1>
        <p className="text-sm text-slate-400 mt-1">Visual overview of your trading activity</p>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={previousMonth} className="px-3 py-2 text-sm text-slate-300 hover:text-slate-100 border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors">
          \u2190 Previous
        </button>
        <div className="text-lg font-semibold text-slate-100">{monthName}</div>
        <div className="flex gap-2">
          <button onClick={goToToday} className="px-3 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">Today</button>
          <button onClick={nextMonth} className="px-3 py-2 text-sm text-slate-300 hover:text-slate-100 border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors">
            Next \u2192
          </button>
        </div>
      </div>

      {/* Country filter */}
      {allCountries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCountries(new Set())}
            className={`px-3 py-1 text-xs rounded-full border transition-colors
              ${selectedCountries.size === 0 ? 'bg-brand text-white border-brand' : 'border-border-primary text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          {allCountries.map(country => {
            const active = selectedCountries.has(country);
            return (
              <button
                key={country}
                onClick={() => toggleCountry(country)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors
                  ${active ? 'bg-brand text-white border-brand' : 'border-border-primary text-slate-400 hover:text-slate-200'}`}
              >
                {country}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
          <div className="spinner" /> Loading calendar...
        </div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="bg-panel rounded-xl border border-border-primary p-4 mb-6">
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">{day}</div>
              ))}
              {days.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
                const stats = getDayStats(date);
                const dayEvents = getEventsForDay(date);
                const hasContent = stats.totalTrades > 0 || dayEvents.length > 0;
                const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                const colorBar = getDayColor(date);
                return (
                  <div
                    key={idx}
                    onClick={() => hasContent && setSelectedDay(date)}
                    className={`aspect-square rounded-lg p-1.5 flex flex-col transition-all relative overflow-hidden
                      ${hasContent ? 'cursor-pointer hover:bg-surface-secondary' : ''}
                      border ${isToday ? 'border-brand/50 bg-brand/5' : 'border-transparent'}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-brand' : 'text-slate-300'}`}>
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {dayEvents.length <= 3 ? dayEvents.map((ev, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: impactColor(ev.impact) }} />
                        )) : (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: impactColor(getHighestImpact(dayEvents)) }} />
                            <span className="text-[9px] text-slate-500">{dayEvents.length}</span>
                          </>
                        )}
                      </div>
                    )}
                    {stats.totalTrades > 0 && (
                      <>
                        <span className="text-[9px] text-slate-500 mt-auto">
                          {stats.totalTrades}t
                        </span>
                        {stats.closedTrades > 0 && (
                          <span className={`text-[9px] font-semibold ${stats.totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(stats.totalPL, true)}
                          </span>
                        )}
                      </>
                    )}
                    {colorBar && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colorBar}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-xs text-slate-400">
            <div className="flex items-center gap-2"><div className="w-3 h-1 rounded bg-success" /><span>Profitable Day</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-1 rounded bg-danger" /><span>Loss Day</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-1 rounded bg-slate-600" /><span>Break-even / Open</span></div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-danger" /><span>High Impact Event</span></div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-warning" /><span>Medium Impact</span></div>
          </div>
        </>
      )}

      {/* Day detail modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]" onClick={() => setSelectedDay(null)}>
          <div
            className="bg-panel border border-border-primary rounded-2xl w-full max-w-[800px] shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border-primary">
              <h2 className="text-lg font-bold text-slate-100">
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <button className="w-8 h-8 rounded-lg border border-border-primary flex items-center justify-center text-slate-100 hover:bg-surface-secondary" onClick={() => setSelectedDay(null)}>
                \u2715
              </button>
            </div>

            {/* Day stats */}
            {selectedDayStats && selectedDayStats.totalTrades > 0 && (
              <div className="grid grid-cols-3 gap-4 p-6 pb-0">
                <div className="bg-surface rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Total Trades</div>
                  <div className="text-lg font-bold text-slate-100">{selectedDayStats.totalTrades}</div>
                </div>
                <div className="bg-surface rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">W/L</div>
                  <div className="text-lg font-bold">
                    <span className="text-success">{selectedDayStats.wins}</span>
                    {' / '}
                    <span className="text-danger">{selectedDayStats.losses}</span>
                  </div>
                </div>
                <div className="bg-surface rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Total P/L</div>
                  <div className={`text-lg font-bold ${selectedDayStats.totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(selectedDayStats.totalPL, true)}
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 space-y-4">
              {/* Macro events */}
              {selectedDayEvents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Macro Events</h3>
                  <div className="space-y-2">
                    {selectedDayEvents.map((ev, i) => (
                      <div key={i} className="bg-surface rounded-lg p-3 border border-border-primary">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: impactColor(ev.impact) }} />
                          <span className="text-sm font-medium text-slate-100">{ev.eventName}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          {ev.eventTime && <span>{ev.eventTime}</span>}
                          {ev.country && <span>{ev.country}</span>}
                          {ev.actual && <span>Actual: {ev.actual}</span>}
                          {ev.forecast && <span>Forecast: {ev.forecast}</span>}
                          {ev.previous && <span>Previous: {ev.previous}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trades */}
              {selectedDayTrades.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Trades</h3>
                  <div className="space-y-2">
                    {selectedDayTrades.map(trade => {
                      const pl = calculatePL(trade);
                      const hasPL = trade.exitPrice !== null && trade.entryPrice !== null && trade.positionSize !== null;
                      return (
                        <div key={trade.id} className="bg-surface rounded-lg p-3 border border-border-primary">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100">{trade.ticker}</span>
                              {trade.playbookTitle && <span className="text-xs text-slate-500">{trade.playbookTitle}</span>}
                            </div>
                            {hasPL && (
                              <span className={`text-sm font-semibold ${pl >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(pl, true)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span>Entry: {trade.entryPrice?.toFixed(5)}</span>
                            <span>Exit: {trade.exitPrice?.toFixed(5) || 'Open'}</span>
                            <span>Size: {trade.positionSize}</span>
                          </div>
                          {trade.notes && <div className="text-xs text-slate-400 mt-2 line-clamp-2">{trade.notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
