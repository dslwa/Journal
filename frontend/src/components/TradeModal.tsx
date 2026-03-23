import React, { useEffect, useRef, useState } from "react";
import type { Trade, UUID, Playbook } from "@/types";
import {
  apiCreateTrade,
  apiUpdateTrade,
  apiListPlaybook,
} from "@/api/client";
import { useToast } from "./ToastProvider";
import { useConfirm } from "./ConfirmDialog";
import { toLocalInputValue, fromLocalInputValue } from "@/utils/formatters";

const POPULAR_TICKERS = [
  "NQ",
  "EURUSD",
  "AUDUSD",
  "GBPUSD",
  "USDCAD",
  "ES",
  "YM",
  "USDJPY",
  "EURJPY",
  "GBPJPY"
];

type Props = {
  trade?: Trade;
  onClose: () => void;
  onSaved: (t: Trade) => void | Promise<void>;
  onDeleted?: (id: UUID) => void;
  currentBalance?: number;
};

type Editable = Omit<Trade, "id" | "createdAt"> & { id?: UUID };

export default function TradeModal({ trade, onClose, onSaved, onDeleted, currentBalance = 10000 }: Props) {
  const isNew = !trade?.id;
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [data, setData] = useState<Editable>(() => ({
    id: trade?.id,
    ticker: trade?.ticker ?? "",
    direction: trade?.direction ?? "LONG",
    entryPrice: trade?.entryPrice ?? 0,
    exitPrice: trade?.exitPrice ?? null,
    positionSize: trade?.positionSize ?? 0,
    openedAt: trade?.openedAt ?? new Date().toISOString(),
    closedAt: trade?.closedAt ?? null,
    notes: trade?.notes ?? "",
    stopLoss: trade?.stopLoss ?? null,
    playbookId: trade?.playbookId ?? null,
  }));

  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [busy, setBusy] = useState(false);
  const [openedAtText, setOpenedAtText] = useState(toLocalInputValue(trade?.openedAt ?? new Date().toISOString()));
  const [closedAtText, setClosedAtText] = useState(toLocalInputValue(trade?.closedAt));
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false);

  useEffect(() => {
    const loadPlaybooks = async () => {
      try {
        const res = await apiListPlaybook();
        setPlaybooks(res.data);
      } catch (err) {
        console.error("Failed to load playbooks", err);
      }
    };
    loadPlaybooks();
  }, []);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const update = <K extends keyof Editable>(key: K, value: Editable[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setBusy(true);
    try {
      let saved: Trade;
      if (isNew) {
        const res = await apiCreateTrade({
          ...data,
          notes: data.notes || null,
        });
        saved = res.data;
      } else {
        const res = await apiUpdateTrade(data.id as UUID, {
          ...data,
          notes: data.notes || null,
        });
        saved = res.data;
      }

      onClose();
      await onSaved(saved);
      showToast(isNew ? 'Trade created successfully' : 'Trade updated successfully', 'success');
    } catch (err) {
      showToast('Failed to save trade', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeTrade = async () => {
    if (!onDeleted || !data.id) return;

    const confirmed = await confirm({
      title: 'Delete Trade',
      message: 'Are you sure you want to delete this trade? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      onDeleted(data.id);
    }
  };

  const filteredTickers = POPULAR_TICKERS.filter(t =>
    t.toLowerCase().includes(data.ticker.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 980 }} role="dialog" aria-modal="true" aria-label={isNew ? "New Trade" : "Edit Trade"}>
        <header className="modal-header">
          <h2 className="modal-title">
            {isNew ? "New Trade" : "Edit Trade"}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="trade-modal-grid">
          <L label="Ticker Symbol">
            <div style={{ position: "relative" }}>
              <input
                className="input"
                value={data.ticker}
                onChange={(e) => {
                  update("ticker", e.target.value);
                  setShowTickerSuggestions(true);
                }}
                onFocus={() => setShowTickerSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTickerSuggestions(false), 200)}
                placeholder="e.g. NQ, EURUSD, AAPL"
              />
              {showTickerSuggestions && filteredTickers.length > 0 && (
                <div className="ticker-suggestions">
                  {filteredTickers.map((ticker) => (
                    <div
                      key={ticker}
                      className="ticker-suggestion"
                      onMouseDown={() => {
                        update("ticker", ticker);
                        setShowTickerSuggestions(false);
                      }}
                    >
                      {ticker}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </L>

          <L label="Strategy (optional)">
            <select
              className="input"
              value={data.playbookId || ""}
              onChange={(e) => update("playbookId", e.target.value || null)}
            >
              <option value="">-- No strategy --</option>
              {playbooks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </L>

          <L label="Position Size">
            <input
              className="input"
              type="number"
              step="0.01"
              value={data.positionSize ?? ""}
              onChange={(e) => update("positionSize", e.target.value === "" ? 0 : Number(e.target.value))}
              placeholder="0.10"
            />
          </L>

          <L label="Stop Loss">
            <input
              className="input"
              type="number"
              step="0.00001"
              value={data.stopLoss ?? ""}
              onChange={(e) => update("stopLoss", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="1.23000"
            />
          </L>

          <L label="Entry Price">
            <input
              className="input"
              type="number"
              step="0.00001"
              value={data.entryPrice ?? ""}
              onChange={(e) => update("entryPrice", e.target.value === "" ? 0 : Number(e.target.value))}
              placeholder="1.23456"
            />
          </L>

          <L label="Exit Price (Take Profit)">
            <input
              className="input"
              type="number"
              step="0.00001"
              value={data.exitPrice ?? ""}
              onChange={(e) => update("exitPrice", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="1.25000"
            />
          </L>

          <L label="Opened At">
            <input
              className="input"
              type="text"
              value={openedAtText}
              onChange={(e) => {
                setOpenedAtText(e.target.value);
                try {
                  const iso = fromLocalInputValue(e.target.value);
                  if (iso) update("openedAt", iso);
                } catch (err) {
                  // Ignore parsing errors during typing
                }
              }}
              placeholder="YYYY-MM-DD HH:mm (e.g. 2025-11-07 14:30)"
            />
          </L>
          <L label="Closed At">
            <input
              className="input"
              type="text"
              value={closedAtText}
              onChange={(e) => {
                setClosedAtText(e.target.value);
                try {
                  const iso = e.target.value ? fromLocalInputValue(e.target.value) : null;
                  update("closedAt", iso);
                } catch (err) {
                  // Ignore parsing errors during typing
                }
              }}
              placeholder="YYYY-MM-DD HH:mm (optional)"
            />
          </L>
        </div>

        <div className="trade-modal-section">
          <L label="Direction">
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className={`btn-direction long ${data.direction === 'LONG' ? 'active' : ''}`}
                onClick={() => update("direction", "LONG")}
              >
                📈 Long
              </button>
              <button
                type="button"
                className={`btn-direction short ${data.direction === 'SHORT' ? 'active' : ''}`}
                onClick={() => update("direction", "SHORT")}
              >
                📉 Short
              </button>
            </div>
          </L>

          <L label="Notes">
            <textarea
              className="input"
              style={{ minHeight: 120, resize: "vertical", fontFamily: "inherit" }}
              value={data.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Add trade notes, setup description, lessons learned..."
            />
          </L>
        </div>

        <footer className="trade-modal-footer">
          {!isNew && onDeleted && (
            <button className="danger" onClick={removeTrade} disabled={busy}>
              Delete Trade
            </button>
          )}
          <div className="spacer" />
          <button className="primary" onClick={save} disabled={busy || !data.ticker}>
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
}

function L({ label: lbl, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="form-group">
      <div className="trade-modal-label">{lbl}</div>
      {children}
    </label>
  );
}
