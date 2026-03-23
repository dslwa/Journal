import { useEffect, useState } from 'react';
import type { JournalEntry } from '@/types';

const MOODS = ['😫', '😟', '😐', '🙂', '😄'];
const ENERGY_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

interface Props {
  entry: JournalEntry | null;
  date: string;
  onClose: () => void;
  onSave: (entry: Partial<JournalEntry>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function JournalEntryModal({ entry, date, onClose, onSave, onDelete }: Props) {
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(entry?.energy ?? null);
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [lessonsLearned, setLessonsLearned] = useState(entry?.lessonsLearned ?? '');
  const [mistakes, setMistakes] = useState(entry?.mistakes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ entryDate: date, mood, energy, notes, lessonsLearned, mistakes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="journal-modal-section">
          <label className="journal-modal-label">Mood</label>
          <div className="journal-selector-row">
            {MOODS.map((emoji, i) => (
              <button
                key={i}
                className={`journal-mood-btn${mood === i + 1 ? ' active' : ''}`}
                onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                title={`${i + 1}/5`}
              >
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <span className="journal-mood-btn-label">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="journal-modal-section">
          <label className="journal-modal-label">Energy Level</label>
          <div className="journal-selector-row">
            {ENERGY_LABELS.map((lbl, i) => (
              <button
                key={i}
                className={`journal-energy-btn${energy === i + 1 ? ' active' : ''}`}
                onClick={() => setEnergy(energy === i + 1 ? null : i + 1)}
              >
                <div className="journal-energy-bar">
                  {Array.from({ length: i + 1 }).map((_, j) => (
                    <div key={j} className="journal-energy-bar-dot" />
                  ))}
                </div>
                <span className="journal-energy-btn-label">{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="journal-modal-section">
          <label className="journal-modal-label">Notes</label>
          <textarea
            className="input"
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="How was your trading day? What was your mindset?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="journal-modal-section">
          <label className="journal-modal-label">Lessons Learned</label>
          <textarea
            className="input"
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="What did you learn today?"
            value={lessonsLearned}
            onChange={e => setLessonsLearned(e.target.value)}
          />
        </div>

        <div className="journal-modal-section">
          <label className="journal-modal-label">Mistakes</label>
          <textarea
            className="input"
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="What mistakes did you make? How can you avoid them?"
            value={mistakes}
            onChange={e => setMistakes(e.target.value)}
          />
        </div>

        <div className="modal-footer-spread">
          {entry && onDelete && (
            <button className="danger" onClick={onDelete}>Delete Entry</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
