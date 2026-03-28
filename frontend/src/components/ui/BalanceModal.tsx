import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface Props {
  currentBalance: number;
  onClose: () => void;
  onSave: (newBalance: number) => Promise<void>;
}

export default function BalanceModal({ currentBalance, onClose, onSave }: Props) {
  const [balance, setBalance] = useState(String(currentBalance));
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  useEscapeKey(onClose);

  const handleSave = async () => {
    const num = Number(balance);
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid positive number', 'error');
      return;
    }
    setBusy(true);
    try {
      await onSave(num);
      onClose();
    } catch {
      showToast('Failed to update balance', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]" onClick={onClose}>
      <div
        className="bg-panel border border-border-primary rounded-2xl p-6 w-full max-w-[480px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-primary">
          <h2 className="text-xl font-bold text-slate-100">Set Account Balance</h2>
          <button
            className="w-8 h-8 rounded-lg border border-border-primary flex items-center justify-center text-slate-100 hover:bg-surface-secondary"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-100 mb-2">Initial Account Balance</label>
          <input
            className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
              rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="10000.00"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-2">
            This is your starting balance. P/L from trades will be added to this amount.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border-primary">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-lg border border-border-primary bg-panel text-slate-100 text-sm font-medium hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save Balance'}
          </button>
        </div>
      </div>
    </div>
  );
}
