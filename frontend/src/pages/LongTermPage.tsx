import { useEffect, useMemo, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import Layout from '@/components/layout/Layout';
import {
  apiCreateLongTermEntry,
  apiDeleteLongTermEntry,
  apiListLongTermEntries,
  apiUpdateLongTermEntry,
} from '@/api/client';
import type { LongTermCategory, LongTermEntry, LongTermStatus, UUID } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const AUTO_RETRY_LIMIT = 3;
const AUTO_RETRY_DELAY_MS = 2000;

const inputCls = `w-full bg-surface border border-border-primary text-slate-100 px-3 py-2.5
  rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500`;

const CATEGORY_META: Record<LongTermCategory, { label: string; subtitle: string; accent: string }> = {
  THEME: {
    label: 'Themes',
    subtitle: 'Big-picture market ideas worth tracking for weeks or months.',
    accent: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  },
  WATCHLIST: {
    label: 'Watchlist',
    subtitle: 'Assets and setups waiting for price, catalyst, or confirmation.',
    accent: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  },
  GOAL: {
    label: 'Goals',
    subtitle: 'Quarterly process goals, portfolio targets, and habits to reinforce.',
    accent: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  },
  REVIEW: {
    label: 'Reviews',
    subtitle: 'Monthly or quarterly reflections on what is still valid and what changed.',
    accent: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20',
  },
};

const STATUS_META: Record<LongTermStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  ON_WATCH: { label: 'On Watch', className: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
  BUILDING: { label: 'Building', className: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
  COMPLETED: { label: 'Completed', className: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  INVALIDATED: { label: 'Invalidated', className: 'text-rose-300 bg-rose-500/10 border-rose-500/20' },
};

const CATEGORY_ORDER: LongTermCategory[] = ['THEME', 'WATCHLIST', 'GOAL', 'REVIEW'];
const STATUS_OPTIONS: LongTermStatus[] = ['ACTIVE', 'ON_WATCH', 'BUILDING', 'COMPLETED', 'INVALIDATED'];

const EMPTY_FORM = {
  title: '',
  category: 'THEME' as LongTermCategory,
  status: 'ACTIVE' as LongTermStatus,
  asset: '',
  horizon: '3-6M',
  thesis: '',
  triggerPlan: '',
  invalidation: '',
  notes: '',
  targetDate: '',
};

type FormState = typeof EMPTY_FORM;
type CategoryFilter = 'ALL' | LongTermCategory;

export default function LongTermPage() {
  const [entries, setEntries] = useState<LongTermEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isWaitingForRetry, setIsWaitingForRetry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LongTermEntry | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const retryTimeoutRef = useRef<number | null>(null);

  const closeModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setForm(EMPTY_FORM);
  };

  useEffect(() => {
    void loadEntries();
    return () => {
      if (retryTimeoutRef.current !== null) window.clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  useEscapeKey(showModal ? closeModal : null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (categoryFilter !== 'ALL' && entry.category !== categoryFilter) return false;
      if (!searchQuery) return true;

      const q = searchQuery.toLowerCase();
      return [
        entry.title,
        entry.asset,
        entry.horizon,
        entry.thesis,
        entry.triggerPlan,
        entry.invalidation,
        entry.notes,
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [entries, categoryFilter, searchQuery]);

  const groupedEntries = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: filteredEntries.filter((entry) => entry.category === category),
    })).filter((group) => group.items.length > 0);
  }, [filteredEntries]);

  const summary = useMemo(() => ({
    activeThemes: entries.filter((entry) => entry.category === 'THEME' && entry.status === 'ACTIVE').length,
    watchlist: entries.filter((entry) => entry.category === 'WATCHLIST' && entry.status !== 'INVALIDATED').length,
    openGoals: entries.filter((entry) => entry.category === 'GOAL' && entry.status !== 'COMPLETED').length,
    reviews: entries.filter((entry) => entry.category === 'REVIEW').length,
  }), [entries]);

  const getLoadErrorMessage = (err: unknown, willRetry: boolean) => {
    const axErr = err as AxiosError<{ message?: string }>;
    const status = axErr?.response?.status;
    const apiMessage = axErr?.response?.data?.message;

    if (status === 502 || axErr?.code === 'ERR_NETWORK' || !axErr?.response) {
      return willRetry
        ? 'Backend is starting up. Retrying automatically...'
        : 'Cannot reach the backend right now. It may still be starting. Try again in a moment.';
    }

    return apiMessage || axErr?.message || 'Failed to load long-term entries.';
  };

  const shouldRetryLoad = (err: unknown) => {
    const axErr = err as AxiosError;
    return axErr?.response?.status === 502 || axErr?.code === 'ERR_NETWORK' || !axErr?.response;
  };

  const loadEntries = async (attempt = 0) => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setLoading(true);
    setIsWaitingForRetry(false);
    if (attempt === 0) setLoadError('');

    try {
      setEntries((await apiListLongTermEntries()).data);
      setLoadError('');
    } catch (err) {
      const willRetry = shouldRetryLoad(err) && attempt < AUTO_RETRY_LIMIT - 1;
      setLoadError(getLoadErrorMessage(err, willRetry));
      if (willRetry) {
        setIsWaitingForRetry(true);
        retryTimeoutRef.current = window.setTimeout(() => { void loadEntries(attempt + 1); }, AUTO_RETRY_DELAY_MS);
      }
    } finally {
      setLoading(false);
    }
  };

  const retryLoad = () => { void loadEntries(); };

  const openNew = (category?: LongTermCategory) => {
    setEditingEntry(null);
    setForm({ ...EMPTY_FORM, category: category ?? 'THEME' });
    setShowModal(true);
  };

  const openEdit = (entry: LongTermEntry) => {
    setEditingEntry(entry);
    setForm({
      title: entry.title,
      category: entry.category,
      status: entry.status,
      asset: entry.asset ?? '',
      horizon: entry.horizon ?? '',
      thesis: entry.thesis ?? '',
      triggerPlan: entry.triggerPlan ?? '',
      invalidation: entry.invalidation ?? '',
      notes: entry.notes ?? '',
      targetDate: entry.targetDate ?? '',
    });
    setShowModal(true);
  };

  const saveEntry = async () => {
    try {
      const payload = {
        ...form,
        asset: form.asset || null,
        horizon: form.horizon || null,
        thesis: form.thesis || null,
        triggerPlan: form.triggerPlan || null,
        invalidation: form.invalidation || null,
        notes: form.notes || null,
        targetDate: form.targetDate || null,
      };

      if (editingEntry) {
        const res = await apiUpdateLongTermEntry(editingEntry.id, payload);
        setEntries(entries.map((entry) => entry.id === editingEntry.id ? res.data : entry));
        showToast('Long-term entry updated');
      } else {
        const res = await apiCreateLongTermEntry(payload);
        setEntries([res.data, ...entries]);
        showToast('Long-term entry created');
      }
      closeModal();
    } catch {
      showToast('Failed to save long-term entry', 'error');
    }
  };

  const deleteEntry = async (id: UUID) => {
    const confirmed = await confirm({
      title: 'Delete Long-Term Entry',
      message: 'This will permanently remove the item from your long-term plan.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    try {
      await apiDeleteLongTermEntry(id);
      setEntries(entries.filter((entry) => entry.id !== id));
      showToast('Long-term entry deleted');
    } catch {
      showToast('Failed to delete long-term entry', 'error');
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return null;
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getSnippet = (value: string | null | undefined, limit = 180) => {
    if (!value) return '';
    return value.length > limit ? `${value.slice(0, limit)}...` : value;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Long Term</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track themes, watchlists, goals, and review notes beyond the daily trade flow.
          </p>
        </div>
        <button
          onClick={() => openNew()}
          className="px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          + New Long-Term Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            onClick={() => openNew(category)}
            className="text-left bg-panel border border-border-primary rounded-xl p-4 hover:border-brand/30 transition-colors"
          >
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold mb-3 ${CATEGORY_META[category].accent}`}>
              {CATEGORY_META[category].label}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {CATEGORY_META[category].subtitle}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Themes" value={summary.activeThemes} helper="Big-picture ideas in play" />
        <StatCard label="Watchlist Names" value={summary.watchlist} helper="Assets waiting for a trigger" />
        <StatCard label="Open Goals" value={summary.openGoals} helper="Quarterly process and outcome focus" />
        <StatCard label="Reviews Logged" value={summary.reviews} helper="Periodic perspective checks" />
      </div>

      <div className="bg-panel border border-border-primary rounded-xl p-4 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            className={`${inputCls} lg:max-w-md`}
            placeholder="Search thesis, trigger, asset, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={categoryFilter === 'ALL'}
              label="All"
              onClick={() => setCategoryFilter('ALL')}
            />
            {CATEGORY_ORDER.map((category) => (
              <FilterChip
                key={category}
                active={categoryFilter === category}
                label={CATEGORY_META[category].label}
                onClick={() => setCategoryFilter(category)}
              />
            ))}
          </div>
        </div>
      </div>

      {loadError && entries.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-amber-100">{loadError}</p>
            <button
              onClick={retryLoad}
              className="px-3 py-1.5 rounded-lg border border-amber-400/30 text-xs font-medium text-amber-100 hover:bg-amber-500/10"
            >
              Retry now
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
          <div className="spinner" /> Loading long-term plan...
        </div>
      ) : loadError && entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">{isWaitingForRetry ? '\u23F3' : '\u26A0\uFE0F'}</div>
          <div className="text-base font-medium text-slate-300 mb-1">Could not load long-term entries</div>
          <div className="text-sm text-slate-500 mb-4 max-w-md">{loadError}</div>
          <button onClick={retryLoad} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover">
            Retry now
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-panel border border-border-primary rounded-2xl p-8 md:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 text-brand mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M3 12h5l3-8 4 16 3-8h3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Build your higher-timeframe map</h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto mb-8">
            Use this section to keep the bigger picture visible: which themes matter, what is on deck,
            what you are trying to improve this quarter, and what the last review changed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="text-left bg-surface border border-border-primary rounded-xl p-4">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold mb-3 ${CATEGORY_META[category].accent}`}>
                  {CATEGORY_META[category].label}
                </div>
                <p className="text-sm text-slate-400">{CATEGORY_META[category].subtitle}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => openNew()}
            className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover"
          >
            + Create First Entry
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-base font-medium text-slate-300 mb-1">No entries match this filter</div>
          <div className="text-sm text-slate-500">Try another category or a broader search phrase.</div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEntries.map((group) => (
            <section key={group.category}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{CATEGORY_META[group.category].label}</h2>
                  <p className="text-sm text-slate-500">{CATEGORY_META[group.category].subtitle}</p>
                </div>
                <span className="text-xs text-slate-500">{group.items.length} item{group.items.length === 1 ? '' : 's'}</span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {group.items.map((entry) => (
                  <article key={entry.id} className="bg-panel border border-border-primary rounded-2xl p-5 hover:border-brand/30 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${CATEGORY_META[entry.category].accent}`}>
                            {CATEGORY_META[entry.category].label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${STATUS_META[entry.status].className}`}>
                            {STATUS_META[entry.status].label}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-100">{entry.title}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                          {entry.asset && <span>Asset: {entry.asset}</span>}
                          {entry.horizon && <span>Horizon: {entry.horizon}</span>}
                          {entry.targetDate && <span>Target: {formatDate(entry.targetDate)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEdit(entry)} className="text-xs text-slate-400 hover:text-slate-200">Edit</button>
                        <button onClick={() => deleteEntry(entry.id)} className="text-xs text-danger hover:text-red-300">Delete</button>
                      </div>
                    </div>

                    {entry.thesis && (
                      <div className="mb-3">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Thesis</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{getSnippet(entry.thesis)}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entry.triggerPlan && (
                        <div className="rounded-xl bg-surface border border-border-primary p-3">
                          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Trigger Plan</div>
                          <p className="text-sm text-slate-400 leading-relaxed">{getSnippet(entry.triggerPlan, 120)}</p>
                        </div>
                      )}
                      {entry.invalidation && (
                        <div className="rounded-xl bg-surface border border-border-primary p-3">
                          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Invalidation</div>
                          <p className="text-sm text-slate-400 leading-relaxed">{getSnippet(entry.invalidation, 120)}</p>
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <div className="mt-3 rounded-xl bg-surface border border-border-primary p-3">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Notes</div>
                        <p className="text-sm text-slate-400 leading-relaxed">{getSnippet(entry.notes, 180)}</p>
                      </div>
                    )}

                    <div className="mt-4 text-[11px] text-slate-600">
                      Updated {formatDateTime(entry.updatedAt)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[5vh] z-[1000] overflow-y-auto" onClick={closeModal}>
          <div className="bg-panel border border-border-primary rounded-2xl w-full max-w-[860px] shadow-2xl mb-8" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border-primary">
              <div>
                <h2 className="text-xl font-bold text-slate-100">{editingEntry ? 'Edit Long-Term Entry' : 'New Long-Term Entry'}</h2>
                <p className="text-sm text-slate-500 mt-1">Capture the idea, the trigger, and what would prove you wrong.</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg border border-border-primary flex items-center justify-center text-slate-100 hover:bg-surface-secondary">{'\u2715'}</button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                  <input
                    className={inputCls}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. AI infra leaders after earnings reset"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Asset / Market</label>
                  <input
                    className={inputCls}
                    value={form.asset}
                    onChange={(e) => setForm({ ...form, asset: e.target.value })}
                    placeholder="e.g. NVDA, BTC, NASDAQ, Gold miners"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                  <select
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as LongTermCategory })}
                  >
                    {CATEGORY_ORDER.map((category) => (
                      <option key={category} value={category}>{CATEGORY_META[category].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                  <select
                    className={inputCls}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as LongTermStatus })}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{STATUS_META[status].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Horizon</label>
                  <input
                    className={inputCls}
                    value={form.horizon}
                    onChange={(e) => setForm({ ...form, horizon: e.target.value })}
                    placeholder="e.g. 1-3M, 3-6M, 6-12M"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Thesis</label>
                <textarea
                  className={`${inputCls} min-h-[120px] resize-y`}
                  value={form.thesis}
                  onChange={(e) => setForm({ ...form, thesis: e.target.value })}
                  placeholder="What is the higher-timeframe idea? Why does it matter now?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Trigger Plan</label>
                  <textarea
                    className={`${inputCls} min-h-[120px] resize-y`}
                    value={form.triggerPlan}
                    onChange={(e) => setForm({ ...form, triggerPlan: e.target.value })}
                    placeholder="What needs to happen before you act?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Invalidation</label>
                  <textarea
                    className={`${inputCls} min-h-[120px] resize-y`}
                    value={form.invalidation}
                    onChange={(e) => setForm({ ...form, invalidation: e.target.value })}
                    placeholder="What would tell you this idea is wrong?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
                  <textarea
                    className={`${inputCls} min-h-[140px] resize-y`}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Positioning ideas, portfolio sizing, scenario notes, lessons from recent price action..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Target / Review Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.targetDate}
                    onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    Useful for goal deadlines, watchlist review dates, or the next thesis check-in.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 pt-4 border-t border-border-primary">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 rounded-lg border border-border-primary text-slate-100 text-sm font-medium hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                disabled={!form.title.trim()}
                className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors"
              >
                {editingEntry ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="bg-panel border border-border-primary rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div className="text-3xl font-bold text-slate-100 mb-1">{value}</div>
      <div className="text-sm text-slate-400">{helper}</div>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? 'bg-brand/15 text-brand border-brand/30'
          : 'text-slate-400 border-border-primary hover:text-slate-200 hover:bg-surface-secondary'
      }`}
    >
      {label}
    </button>
  );
}
