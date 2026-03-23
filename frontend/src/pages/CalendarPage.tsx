import { useEffect, useState } from "react";
import { apiListTrades, apiGetMacroEvents } from "@/api/client";
import type { Trade, MacroEvent } from "@/types";
import Layout from "@/components/Layout";
import TradeModal from "@/components/TradeModal";
import { calculatePL } from "@/utils/tradeCalculations";
import { formatCurrency } from "@/utils/formatters";

export default function CalendarPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTradeForView, setSelectedTradeForView] = useState<Trade | null>(null);
  const [macroEvents, setMacroEvents] = useState<MacroEvent[]>([]);

  useEffect(() => {
    loadTrades();
  }, []);

  useEffect(() => {
    loadMacroEvents();
  }, [currentDate]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDay) {
        setSelectedDay(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedDay]);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await apiListTrades();
      setTrades(res.data);
    } finally {
      setLoading(false);
    }
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
    } catch {
      // Macro events are optional — API key may not be configured
      setMacroEvents([]);
    }
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return macroEvents.filter(e => e.eventDate === dateStr);
  };

  const getHighestImpact = (events: MacroEvent[]) => {
    if (events.some(e => e.impact === 'High')) return 'High';
    if (events.some(e => e.impact === 'Medium')) return 'Medium';
    return 'Low';
  };

  const impactColor = (impact: string | null) => {
    if (impact === 'High') return '#ef4444';
    if (impact === 'Medium') return '#f59e0b';
    return '#94a3b8';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getTradesForDay = (date: Date) => {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.openedAt);
      return (
        tradeDate.getDate() === date.getDate() &&
        tradeDate.getMonth() === date.getMonth() &&
        tradeDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getDayStats = (date: Date) => {
    const dayTrades = getTradesForDay(date);
    const closedTrades = dayTrades.filter(t => t.exitPrice !== null && t.entryPrice !== null && t.positionSize !== null);
    const totalPL = closedTrades.reduce((sum, t) => sum + calculatePL(t), 0);
    const wins = closedTrades.filter(t => calculatePL(t) > 0).length;
    const losses = closedTrades.filter(t => calculatePL(t) < 0).length;
    return { totalTrades: dayTrades.length, closedTrades: closedTrades.length, totalPL, wins, losses };
  };

  const getDayColor = (date: Date) => {
    const stats = getDayStats(date);
    if (stats.closedTrades === 0) return stats.totalTrades > 0 ? '#64748b' : 'transparent';
    if (stats.totalPL > 0) return '#10b981';
    if (stats.totalPL < 0) return '#ef4444';
    return '#64748b';
  };

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDayTrades = selectedDay ? getTradesForDay(selectedDay) : [];
  const selectedDayStats = selectedDay ? getDayStats(selectedDay) : null;
  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  if (loading) {
    return (
      <Layout>
        <div className="page-container">
          <div className="page-loader">
            <div className="spinner" />
            Loading calendar...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <div>
            <h1 className="page-title">Trading Calendar</h1>
            <p className="page-subtitle">Visual overview of your trading activity</p>
          </div>
        </header>

        <div className="cal-nav">
          <button className="cal-nav-btns" onClick={previousMonth}>← Previous</button>
          <div className="cal-month-title">{monthName}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="button primary" onClick={goToToday}>Today</button>
            <button className="cal-nav-btns" onClick={nextMonth}>Next →</button>
          </div>
        </div>

        <div className="cal-card">
          <div className="cal-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="cal-day-header">{day}</div>
            ))}
            {days.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="cal-day-empty" />;
              const stats = getDayStats(date);
              const dayEvents = getEventsForDay(date);
              const hasContent = stats.totalTrades > 0 || dayEvents.length > 0;
              const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
              const classes = `cal-day ${hasContent ? 'active' : ''} ${isToday ? 'today' : ''}`;
              return (
                <div key={idx} className={classes} onClick={() => hasContent && setSelectedDay(date)}>
                  <div className="cal-day-num">{date.getDate()}</div>
                  {dayEvents.length > 0 && (
                    <div className="cal-event-dots">
                      {dayEvents.length <= 3 ? dayEvents.map((ev, i) => (
                        <div key={i} className="cal-event-dot" style={{ background: impactColor(ev.impact) }} title={ev.eventName} />
                      )) : (
                        <>
                          <div className="cal-event-dot" style={{ background: impactColor(getHighestImpact(dayEvents)) }} />
                          <span className="cal-event-count">{dayEvents.length}</span>
                        </>
                      )}
                    </div>
                  )}
                  {stats.totalTrades > 0 && (
                    <>
                      <div className="cal-trade-count">{stats.totalTrades} trade{stats.totalTrades > 1 ? 's' : ''}</div>
                      {stats.closedTrades > 0 && (
                        <div className={`cal-pl-badge ${stats.totalPL >= 0 ? 'positive' : 'negative'}`}>
                          {formatCurrency(stats.totalPL, true)}
                        </div>
                      )}
                      <div className="cal-color-bar" style={{ background: getDayColor(date) }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="cal-legend">
          <div className="cal-legend-item"><div className="cal-legend-color" style={{ background: '#10b981' }} /><span>Profitable Day</span></div>
          <div className="cal-legend-item"><div className="cal-legend-color" style={{ background: '#ef4444' }} /><span>Loss Day</span></div>
          <div className="cal-legend-item"><div className="cal-legend-color" style={{ background: '#64748b' }} /><span>Break-even / Open trades</span></div>
          <div className="cal-legend-item"><div className="cal-event-dot" style={{ background: '#ef4444' }} /><span>High Impact Event</span></div>
          <div className="cal-legend-item"><div className="cal-event-dot" style={{ background: '#f59e0b' }} /><span>Medium Impact</span></div>
        </div>

        {selectedDay && (
          <div className="modal-backdrop" onClick={() => setSelectedDay(null)}>
            <div className="modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="modal-header">
                <h2 className="modal-title">{selectedDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                <button className="modal-close" onClick={() => setSelectedDay(null)}>✕</button>
              </div>
              {selectedDayStats && (
                <div className="day-modal-stats">
                  <div className="day-modal-stat">
                    <div className="day-modal-stat-label">Total Trades</div>
                    <div className="day-modal-stat-value">{selectedDayStats.totalTrades}</div>
                  </div>
                  <div className="day-modal-stat">
                    <div className="day-modal-stat-label">W/L</div>
                    <div className="day-modal-stat-value">
                      <span style={{ color: '#10b981' }}>{selectedDayStats.wins}</span>
                      {' / '}
                      <span style={{ color: '#ef4444' }}>{selectedDayStats.losses}</span>
                    </div>
                  </div>
                  <div className="day-modal-stat">
                    <div className="day-modal-stat-label">Total P/L</div>
                    <div className="day-modal-stat-value" style={{ color: selectedDayStats.totalPL >= 0 ? '#10b981' : '#ef4444' }}>
                      {formatCurrency(selectedDayStats.totalPL, true)}
                    </div>
                  </div>
                </div>
              )}
              {selectedDayEvents.length > 0 && (
                <>
                  <div className="day-modal-section-title">Macro Events:</div>
                  <div className="day-modal-list" style={{ marginBottom: 20 }}>
                    {selectedDayEvents.map((ev, i) => (
                      <div key={i} className="day-modal-event">
                        <div className="day-modal-event-header">
                          <div className="cal-event-dot" style={{ background: impactColor(ev.impact) }} />
                          <span className="day-modal-event-name">{ev.eventName}</span>
                        </div>
                        <div className="day-modal-event-meta">
                          {ev.eventTime && <span>{ev.eventTime}</span>}
                          {ev.country && <span>{ev.country}</span>}
                          {ev.actual && <span>Actual: {ev.actual}</span>}
                          {ev.forecast && <span>Forecast: {ev.forecast}</span>}
                          {ev.previous && <span>Previous: {ev.previous}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selectedDayTrades.length > 0 && <div className="day-modal-section-title">Trades:</div>}
              <div className="day-modal-list">
                {selectedDayTrades.map(trade => {
                  const pl = calculatePL(trade);
                  const hasPL = trade.exitPrice !== null && trade.entryPrice !== null && trade.positionSize !== null;
                  return (
                    <div
                      key={trade.id}
                      className="day-modal-trade"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTradeForView(trade);
                      }}
                    >
                      <div className="day-modal-trade-header">
                        <span className="day-modal-ticker">{trade.ticker}</span>
                        {trade.playbookTitle && (<span className="day-modal-strategy">📋 {trade.playbookTitle}</span>)}
                        {hasPL && (<span className="day-modal-pl" style={{ color: pl >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(pl, true)}</span>)}
                      </div>
                      <div className="day-modal-details">
                        <span>Entry: {trade.entryPrice?.toFixed(5)}</span>
                        <span>Exit: {trade.exitPrice?.toFixed(5) || 'Open'}</span>
                        <span>Size: {trade.positionSize}</span>
                      </div>
                      {trade.notes && (<div className="day-modal-notes">{trade.notes}</div>)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedTradeForView && (
          <TradeModal
            trade={selectedTradeForView}
            onClose={() => setSelectedTradeForView(null)}
            onSaved={async () => {
              await loadTrades();
              setSelectedTradeForView(null);
            }}
            onDeleted={() => {
              loadTrades();
              setSelectedTradeForView(null);
              setSelectedDay(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
