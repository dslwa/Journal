import { useEffect, useState } from 'react';
import { apiListJournalEntries, apiSaveJournalEntry, apiDeleteJournalEntry } from '@/api/client';
import type { JournalEntry } from '@/types';
import Layout from '@/components/layout/Layout';
import JournalEntryModal from '@/components/ui/JournalEntryModal';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';

const MOODS = ['\u{1F62B}', '\u{1F61F}', '\u{1F610}', '\u{1F642}', '\u{1F604}'];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => { loadEntries(); }, [currentDate]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const res = await apiListJournalEntries(from, to);
      setEntries(res.data);
    } finally {
      setLoading(false);
    }
  };

  const getEntryForDate = (dateStr: string) => entries.find(e => e.entryDate === dateStr);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const days: (string | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return days;
  };

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const selectedEntry = selectedDate ? getEntryForDate(selectedDate) : null;

  const handleSave = async (dto: Partial<JournalEntry>) => {
    try {
      await apiSaveJournalEntry(dto);
      await loadEntries();
      setSelectedDate(null);
      showToast('Journal entry saved');
    } catch {
      showToast('Failed to save entry', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    const confirmed = await confirm({ title: 'Delete Journal Entry?', message: 'This will permanently delete this journal entry.', confirmText: 'Delete', confirmVariant: 'danger' });
    if (!confirmed) return;
    try {
      await apiDeleteJournalEntry(selectedDate);
      await loadEntries();
      setSelectedDate(null);
      showToast('Journal entry deleted');
    } catch {
      showToast('Failed to delete entry', 'error');
    }
  };

  const recentEntries = [...entries]
    .filter(e => e.notes || e.lessonsLearned || e.mistakes)
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
    .slice(0, 5);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Psychology Journal</h1>
        <p className="text-sm text-slate-400 mt-1">Track your mood, energy, and daily reflections</p>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="px-3 py-2 text-sm text-slate-300 hover:text-slate-100 border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors"
        >
          \u2190 Previous
        </button>
        <div className="text-lg font-semibold text-slate-100">{monthName}</div>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-2 text-sm text-slate-300 hover:text-slate-100 border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Next \u2192
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
          <div className="spinner" /> Loading journal...
        </div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="bg-panel rounded-xl border border-border-primary p-4 mb-6">
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
              {days.map((dateStr, idx) => {
                if (!dateStr) return <div key={`empty-${idx}`} className="aspect-square" />;
                const entry = getEntryForDate(dateStr);
                const dayNum = parseInt(dateStr.slice(-2));
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-lg p-1.5 cursor-pointer transition-all flex flex-col items-center gap-0.5
                      hover:bg-surface-secondary border
                      ${isToday ? 'border-brand/50 bg-brand/5' : 'border-transparent'}
                      ${entry ? 'bg-surface-secondary/50' : ''}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-brand' : 'text-slate-300'}`}>
                      {dayNum}
                    </span>
                    {entry ? (
                      <>
                        {entry.mood && <span className="text-sm leading-none">{MOODS[entry.mood - 1]}</span>}
                        {entry.energy && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: entry.energy }).map((_, i) => (
                              <div key={i} className="w-1 h-1 rounded-full bg-brand" />
                            ))}
                          </div>
                        )}
                        {(entry.notes || entry.lessonsLearned || entry.mistakes) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100">+</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-base">\u{1F604}</span>
              <span>Mood indicator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand" />)}
              </div>
              <span>Energy level</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span>Has notes</span>
            </div>
          </div>

          {/* Recent reflections */}
          {recentEntries.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-slate-100 mb-4">Recent Reflections</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentEntries.map(entry => (
                  <div
                    key={entry.entryDate}
                    className="bg-panel rounded-xl border border-border-primary p-4 cursor-pointer hover:border-brand/30 transition-colors"
                    onClick={() => setSelectedDate(entry.entryDate)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        {new Date(entry.entryDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {entry.mood && <span className="text-sm">{MOODS[entry.mood - 1]}</span>}
                        {entry.energy && <span className="text-xs text-slate-500">Energy: {entry.energy}/5</span>}
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-1">
                        {entry.notes.slice(0, 150)}{entry.notes.length > 150 ? '...' : ''}
                      </p>
                    )}
                    {entry.lessonsLearned && (
                      <p className="text-xs text-brand/70 mt-1">
                        Lesson: {entry.lessonsLearned.slice(0, 100)}{entry.lessonsLearned.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedDate && (
        <JournalEntryModal
          entry={selectedEntry ?? null}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
          onDelete={selectedEntry ? handleDelete : undefined}
        />
      )}
    </Layout>
  );
}
