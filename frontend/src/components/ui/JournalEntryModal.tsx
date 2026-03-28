import { useState } from 'react';
import type { JournalEntry } from '@/types';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const MOODS = ['\u{1F62B}', '\u{1F61F}', '\u{1F610}', '\u{1F642}', '\u{1F604}'];
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

  useEscapeKey(onClose);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ entryDate: date, mood, energy, notes, lessonsLearned, mistakes });
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]" onClick={onClose}>
      <div
        className="bg-panel border border-border-primary rounded-2xl w-full max-w-[600px] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border-primary">
          <h2 className="text-lg font-bold text-slate-100">{formattedDate}</h2>
          <button
            className="w-8 h-8 rounded-lg border border-border-primary flex items-center justify-center text-slate-100 hover:bg-surface-secondary"
            onClick={onClose}
            aria-label="Close"
          >
            {'\u2715'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mood selector */}
          <div>
            <label className="block text-sm font-medium text-slate-100 mb-3">Mood</label>
            <div className="flex gap-2">
              {MOODS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all
                    ${mood === i + 1
                      ? 'border-brand bg-brand/10 shadow-sm shadow-brand/20'
                      : 'border-border-primary hover:border-border-light hover:bg-surface-secondary'}`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[10px] text-slate-500">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy selector */}
          <div>
            <label className="block text-sm font-medium text-slate-100 mb-3">Energy Level</label>
            <div className="flex gap-2">
              {ENERGY_LABELS.map((lbl, i) => (
                <button
                  key={i}
                  onClick={() => setEnergy(energy === i + 1 ? null : i + 1)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all
                    ${energy === i + 1
                      ? 'border-brand bg-brand/10 shadow-sm shadow-brand/20'
                      : 'border-border-primary hover:border-border-light hover:bg-surface-secondary'}`}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: i + 1 }).map((_, j) => (
                      <div key={j} className={`w-1.5 h-3 rounded-full ${energy === i + 1 ? 'bg-brand' : 'bg-slate-600'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">{lbl}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text fields */}
          <div>
            <label className="block text-sm font-medium text-slate-100 mb-2">Notes</label>
            <textarea
              className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
                rounded-lg text-sm outline-none resize-y min-h-[80px]
                focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
              rows={3}
              placeholder="How was your trading day? What was your mindset?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-100 mb-2">Lessons Learned</label>
            <textarea
              className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
                rounded-lg text-sm outline-none resize-y min-h-[80px]
                focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
              rows={3}
              placeholder="What did you learn today?"
              value={lessonsLearned}
              onChange={e => setLessonsLearned(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-100 mb-2">Mistakes</label>
            <textarea
              className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
                rounded-lg text-sm outline-none resize-y min-h-[80px]
                focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
              rows={3}
              placeholder="What mistakes did you make? How can you avoid them?"
              value={mistakes}
              onChange={e => setMistakes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 pt-4 border-t border-border-primary">
          <div>
            {entry && onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2.5 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors"
              >
                Delete Entry
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border-primary bg-panel text-slate-100 text-sm font-medium hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
