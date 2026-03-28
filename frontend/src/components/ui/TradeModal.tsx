import React, { useEffect, useRef, useState } from 'react';
import type { Attachment, Trade, UUID, Playbook, ChecklistItem } from '@/types';
import {
  apiCreateTrade, apiUpdateTrade, apiUploadAttachments, apiDeleteAttachment,
  apiGetPrice, apiListPlaybook, fileUrl,
} from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { toLocalInputValue, fromLocalInputValue } from '@/utils/formatters';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { POPULAR_TICKERS } from '@/constants';

function parseChecklist(json: string | null | undefined): ChecklistItem[] {
  if (!json) return [];
  try { const p = JSON.parse(json); return Array.isArray(p) ? p : []; } catch { return []; }
}

function checklistFromPlaybook(checklist: string | null | undefined): ChecklistItem[] {
  if (!checklist) return [];
  try { const labels: string[] = JSON.parse(checklist); return Array.isArray(labels) ? labels.map(label => ({ label, checked: false })) : []; } catch { return []; }
}

type Props = {
  trade?: Trade;
  onClose: () => void;
  onSaved: (t: Trade) => void | Promise<void>;
  onDeleted?: (id: UUID) => void;
  currentBalance?: number;
};

type Editable = Omit<Trade, 'id' | 'attachments'> & { id?: UUID };

const inputCls = `w-full bg-surface border border-border-primary text-slate-100 px-3 py-2.5
  rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500`;

export default function TradeModal({ trade, onClose, onSaved, onDeleted, currentBalance = 10000 }: Props) {
  const isNew = !trade?.id;
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [data, setData] = useState<Editable>(() => ({
    id: trade?.id,
    ticker: trade?.ticker ?? '',
    entryPrice: trade?.entryPrice ?? null,
    exitPrice: trade?.exitPrice ?? null,
    positionSize: trade?.positionSize ?? null,
    openedAt: trade?.openedAt ?? new Date().toISOString(),
    closedAt: trade?.closedAt ?? null,
    notes: trade?.notes ?? '',
    tags: trade?.tags ?? '',
    rating: trade?.rating ?? null,
    riskPercent: trade?.riskPercent ?? 1,
    stopLoss: trade?.stopLoss ?? null,
    emotionBefore: trade?.emotionBefore ?? null,
    emotionAfter: trade?.emotionAfter ?? null,
    preTradeChecklist: trade?.preTradeChecklist ?? null,
    postTradeReview: trade?.postTradeReview ?? null,
    playbookId: trade?.playbookId ?? null,
  }));

  const [attachments, setAttachments] = useState<Attachment[]>(trade?.attachments ?? []);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [busy, setBusy] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [openedAtText, setOpenedAtText] = useState(toLocalInputValue(trade?.openedAt ?? new Date().toISOString()));
  const [closedAtText, setClosedAtText] = useState(toLocalInputValue(trade?.closedAt));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => { apiListPlaybook().then(res => setPlaybooks(res.data)).catch(() => {}); }, []);
  useEffect(() => { setAttachments(trade?.attachments ?? []); }, [trade?.attachments]);

  useEffect(() => {
    const { entryPrice, stopLoss, riskPercent } = data;
    if (entryPrice && stopLoss && riskPercent && currentBalance) {
      const riskAmount = currentBalance * (riskPercent / 100);
      const priceRisk = Math.abs(entryPrice - stopLoss);
      if (priceRisk > 0) setData(d => ({ ...d, positionSize: Number((riskAmount / priceRisk).toFixed(2)) }));
    }
  }, [data.entryPrice, data.stopLoss, data.riskPercent, currentBalance]);

  useEscapeKey(onClose);

  const update = <K extends keyof Editable>(key: K, value: Editable[K]) =>
    setData(d => ({ ...d, [key]: value }));

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setFilesToUpload(prev => prev.concat(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (idx: number) => setFilesToUpload(prev => prev.filter((_, i) => i !== idx));

  const deleteAttachment = async (att: Attachment) => {
    if (!data.id) return;
    setBusy(true);
    try {
      await apiDeleteAttachment(data.id, att.id);
      setAttachments(a => a.filter(x => x.id !== att.id));
      showToast('Attachment deleted');
    } catch { showToast('Failed to delete attachment', 'error'); }
    finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ticker: data.ticker, entryPrice: data.entryPrice, exitPrice: data.exitPrice,
        positionSize: data.positionSize, openedAt: data.openedAt, closedAt: data.closedAt,
        notes: data.notes || null, tags: data.tags || null, rating: data.rating,
        riskPercent: data.riskPercent, stopLoss: data.stopLoss,
        emotionBefore: data.emotionBefore, emotionAfter: data.emotionAfter,
        preTradeChecklist: data.preTradeChecklist, postTradeReview: data.postTradeReview,
        playbookId: data.playbookId,
      };
      let saved: Trade;
      if (isNew) { saved = (await apiCreateTrade(payload)).data; }
      else { saved = (await apiUpdateTrade(data.id as UUID, payload)).data; }

      if (filesToUpload.length) {
        const up = await apiUploadAttachments(saved.id, filesToUpload);
        saved = { ...saved, attachments: up.data };
        setFilesToUpload([]);
      } else {
        saved = { ...saved, attachments };
      }

      onClose();
      await onSaved(saved);
      showToast(isNew ? 'Trade created' : 'Trade updated');
    } catch { showToast('Failed to save trade', 'error'); }
    finally { setBusy(false); }
  };

  const removeTrade = async () => {
    if (!onDeleted || !data.id) return;
    const confirmed = await confirm({ title: 'Delete Trade', message: 'Are you sure? This action cannot be undone.', confirmText: 'Delete', confirmVariant: 'danger' });
    if (confirmed) onDeleted(data.id);
  };

  const fetchCurrentPrice = async () => {
    if (!data.ticker) { showToast('Enter a ticker first', 'error'); return; }
    setFetchingPrice(true);
    try {
      const res = await apiGetPrice(data.ticker);
      if (res.data.price) { update('entryPrice', res.data.price); showToast(`Price: $${res.data.price}`); }
    } catch { showToast(`Could not fetch price for ${data.ticker}`, 'error'); }
    finally { setFetchingPrice(false); }
  };

  const filteredTickers = POPULAR_TICKERS.filter(t => t.toLowerCase().includes(data.ticker.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[5vh] z-[1000] overflow-y-auto">
      <div className="bg-panel border border-border-primary rounded-2xl w-full max-w-[980px] shadow-2xl mb-8" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border-primary">
          <h2 className="text-xl font-bold text-slate-100">{isNew ? 'New Trade' : 'Edit Trade'}</h2>
          <button className="w-8 h-8 rounded-lg border border-border-primary flex items-center justify-center text-slate-100 hover:bg-surface-secondary" onClick={onClose}>{'\u2715'}</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Core fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Ticker Symbol">
              <div className="relative">
                <input className={inputCls} value={data.ticker}
                  onChange={e => { update('ticker', e.target.value); setShowTickerSuggestions(true); }}
                  onFocus={() => setShowTickerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTickerSuggestions(false), 200)}
                  placeholder="e.g. NQ, EURUSD, AAPL" />
                {showTickerSuggestions && filteredTickers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-panel border border-border-primary rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
                    {filteredTickers.map(ticker => (
                      <div key={ticker} className="px-3 py-2 text-sm text-slate-300 hover:bg-surface-secondary cursor-pointer"
                        onMouseDown={() => { update('ticker', ticker); setShowTickerSuggestions(false); }}>
                        {ticker}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Strategy">
              <select className={inputCls} value={data.playbookId || ''}
                onChange={e => {
                  const pbId = e.target.value || null;
                  if (pbId) {
                    const pb = playbooks.find(p => p.id === pbId);
                    const items = pb ? checklistFromPlaybook(pb.checklist) : [];
                    setData(d => ({ ...d, playbookId: pbId, preTradeChecklist: items.length > 0 ? JSON.stringify(items) : d.preTradeChecklist }));
                  } else { update('playbookId', null); }
                }}>
                <option value="">-- No strategy --</option>
                {playbooks.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>

            <Field label="Risk %">
              <input className={inputCls} type="number" step="0.1" value={data.riskPercent ?? ''}
                onChange={e => update('riskPercent', e.target.value === '' ? null : Number(e.target.value))} placeholder="1.0" />
            </Field>

            <Field label="Entry Price">
              <div className="flex gap-2">
                <input className={inputCls} type="number" step="0.00001" value={data.entryPrice ?? ''}
                  onChange={e => update('entryPrice', e.target.value === '' ? null : Number(e.target.value))} placeholder="1.23456" />
                <button onClick={fetchCurrentPrice} disabled={fetchingPrice || !data.ticker}
                  className="px-3 py-2 text-xs bg-surface-secondary border border-border-primary rounded-lg text-slate-300 hover:text-slate-100 whitespace-nowrap disabled:opacity-50">
                  {fetchingPrice ? '...' : 'Get Price'}
                </button>
              </div>
            </Field>

            <Field label="Stop Loss">
              <input className={inputCls} type="number" step="0.00001" value={data.stopLoss ?? ''}
                onChange={e => update('stopLoss', e.target.value === '' ? null : Number(e.target.value))} placeholder="1.23000" />
            </Field>

            <Field label="Exit Price">
              <input className={inputCls} type="number" step="0.00001" value={data.exitPrice ?? ''}
                onChange={e => update('exitPrice', e.target.value === '' ? null : Number(e.target.value))} placeholder="1.25000" />
            </Field>

            <Field label="Position Size">
              <input className={`${inputCls} opacity-70`} type="number" step="0.01" value={data.positionSize ?? ''}
                readOnly placeholder="Calculated from Risk%" />
            </Field>

            <Field label="Opened At">
              <input className={inputCls} type="text" value={openedAtText}
                onChange={e => { setOpenedAtText(e.target.value); try { const iso = fromLocalInputValue(e.target.value); if (iso) update('openedAt', iso); } catch {} }}
                placeholder="YYYY-MM-DD HH:mm" />
            </Field>

            <Field label="Closed At">
              <input className={inputCls} type="text" value={closedAtText}
                onChange={e => { setClosedAtText(e.target.value); try { update('closedAt', e.target.value ? fromLocalInputValue(e.target.value) : null); } catch {} }}
                placeholder="YYYY-MM-DD HH:mm (optional)" />
            </Field>
          </div>

          {/* Direction */}
          <Field label="Direction">
            <div className="flex gap-3">
              <button type="button" onClick={() => {
                const tags = data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
                update('tags', [...tags.filter(t => t !== 'Long' && t !== 'Short'), 'Long'].join(', '));
              }} className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all
                ${data.tags?.includes('Long') ? 'border-success bg-success/10 text-success' : 'border-border-primary text-slate-400 hover:border-border-light'}`}>
                Long
              </button>
              <button type="button" onClick={() => {
                const tags = data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
                update('tags', [...tags.filter(t => t !== 'Long' && t !== 'Short'), 'Short'].join(', '));
              }} className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all
                ${data.tags?.includes('Short') ? 'border-danger bg-danger/10 text-danger' : 'border-border-primary text-slate-400 hover:border-border-light'}`}>
                Short
              </button>
            </div>
          </Field>

          {/* Tags */}
          <Field label="Tags">
            <input className={inputCls} value={data.tags ?? ''}
              onChange={e => update('tags', e.target.value)} placeholder="Breakout, Support, Momentum" />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea className={`${inputCls} min-h-[100px] resize-y`}
              value={data.notes ?? ''} onChange={e => update('notes', e.target.value)}
              placeholder="Trade notes, setup description, lessons learned..." />
          </Field>

          {/* Attachments */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Attachments</h3>
            <div className="flex items-center gap-3 mb-4">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onPickFiles}
                className="text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-border-primary
                  file:bg-surface-secondary file:text-slate-300 file:text-sm file:font-medium file:cursor-pointer" />
              {filesToUpload.length > 0 && <span className="text-xs text-slate-500">{filesToUpload.length} pending</span>}
            </div>

            {(filesToUpload.length > 0 || attachments.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filesToUpload.map((f, i) => {
                  const url = URL.createObjectURL(f);
                  return (
                    <div key={`new-${i}`} className="bg-surface rounded-lg border border-border-primary overflow-hidden">
                      <div className="aspect-video cursor-pointer" onClick={() => setLightboxImage(url)}>
                        <img src={url} alt={f.name} className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                      </div>
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400 truncate">{f.name}</span>
                        <button onClick={() => removePendingFile(i)} className="text-xs text-danger hover:text-red-300">Remove</button>
                      </div>
                    </div>
                  );
                })}
                {attachments.map(att => (
                  <div key={att.id} className="bg-surface rounded-lg border border-border-primary overflow-hidden">
                    <div className="aspect-video cursor-pointer" onClick={() => setLightboxImage(fileUrl(att.url))}>
                      <img src={fileUrl(att.url)} alt={att.filename} className="w-full h-full object-cover"
                        onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                    </div>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400 truncate" title={att.filename}>{att.filename}</span>
                      <button onClick={() => deleteAttachment(att)} disabled={busy} className="text-xs text-danger hover:text-red-300 disabled:opacity-50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 pt-4 border-t border-border-primary">
          <div>
            {!isNew && onDeleted && (
              <button onClick={removeTrade} disabled={busy}
                className="px-4 py-2.5 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors disabled:opacity-50">
                Delete Trade
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border-primary bg-panel text-slate-100 text-sm font-medium hover:bg-surface-secondary">
              Cancel
            </button>
            <button onClick={save} disabled={busy || !data.ticker}
              className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors">
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1100]" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-medium" onClick={() => setLightboxImage(null)}>
            {'\u2715'} Close
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
