import { useEffect, useState } from 'react';
import { apiListJournalEntries, apiSaveJournalEntry, apiDeleteJournalEntry } from '@/api/client';
import type { JournalEntry } from '@/types';
import Layout from '@/components/Layout';
import JournalEntryModal from '@/components/JournalEntryModal';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmDialog';

const MOODS = ['😫', '😟', '😐', '🙂', '😄'];

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
    const confirmed = await confirm({
      title: 'Delete Journal Entry?',
      message: 'This will permanently delete this journal entry.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
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

  if (loading) {
    return (
      <Layout>
        <div className="page-container">
          <div className="page-loader"><div className="spinner" />Loading journal...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Psychology Journal</h1>
          <p className="page-subtitle">Track your mood, energy, and daily reflections</p>
        </header>

        <div className="cal-nav">
          <button onClick={previousMonth}>← Previous</button>
          <div className="cal-month-title">{monthName}</div>
          <div className="cal-nav-btns">
            <button className="primary" onClick={goToToday}>Today</button>
            <button onClick={nextMonth}>Next →</button>
          </div>
        </div>

        <div className="cal-card">
          <div className="cal-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="cal-day-header">{day}</div>
            ))}
            {days.map((dateStr, idx) => {
              if (!dateStr) return <div key={`empty-${idx}`} className="cal-day-empty" />;
              const entry = getEntryForDate(dateStr);
              const dayNum = parseInt(dateStr.slice(-2));
              const isToday = dateStr === todayStr;
              const classes = ['journal-day'];
              if (isToday) classes.push('today');
              if (entry) classes.push('has-entry');
              return (
                <div
                  key={dateStr}
                  className={classes.join(' ')}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div className="journal-day-num">{dayNum}</div>
                  {entry ? (
                    <>
                      {entry.mood && <div className="journal-mood">{MOODS[entry.mood - 1]}</div>}
                      {entry.energy && (
                        <div className="journal-energy">
                          {Array.from({ length: entry.energy }).map((_, i) => (
                            <div key={i} className="journal-energy-dot" />
                          ))}
                        </div>
                      )}
                      {(entry.notes || entry.lessonsLearned || entry.mistakes) && (
                        <div className="journal-notes-dot" />
                      )}
                    </>
                  ) : (
                    <div className="journal-add-hint">+</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="cal-legend">
          <div className="cal-legend-item"><span style={{ fontSize: 16 }}>😄</span><span>Mood indicator</span></div>
          <div className="cal-legend-item"><div style={{ display: 'flex', gap: 2 }}>{[1,2,3].map(i => <div key={i} className="journal-energy-dot" />)}</div><span>Energy level</span></div>
          <div className="cal-legend-item"><div className="journal-energy-dot" /><span>Has notes</span></div>
        </div>

        {recentEntries.length > 0 && (
          <div className="journal-recent">
            <h2 className="journal-recent-title">Recent Reflections</h2>
            <div className="journal-recent-list">
              {recentEntries.map(entry => (
                <div key={entry.entryDate} className="journal-recent-card" onClick={() => setSelectedDate(entry.entryDate)}>
                  <div className="journal-recent-header">
                    <span className="journal-recent-date">
                      {new Date(entry.entryDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="journal-recent-meta">
                      {entry.mood && <span>{MOODS[entry.mood - 1]}</span>}
                      {entry.energy && <span className="journal-recent-energy">Energy: {entry.energy}/5</span>}
                    </div>
                  </div>
                  {entry.notes && <p className="journal-recent-text">{entry.notes.slice(0, 150)}{entry.notes.length > 150 ? '...' : ''}</p>}
                  {entry.lessonsLearned && (
                    <p className="journal-recent-lesson">Lesson: {entry.lessonsLearned.slice(0, 100)}{entry.lessonsLearned.length > 100 ? '...' : ''}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
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
      </div>
    </Layout>
  );
}
