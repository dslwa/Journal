import { useEffect, useState } from "react";
import { useToast } from "./ToastProvider";

type Props = {
  currentBalance: number;
  onClose: () => void;
  onSave: (newBalance: number) => Promise<void>;
};

export default function BalanceModal({ currentBalance, onClose, onSave }: Props) {
  const [balance, setBalance] = useState(String(currentBalance));
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSave = async () => {
    const num = Number(balance);
    if (isNaN(num) || num <= 0) {
      showToast("Please enter a valid positive number", "error");
      return;
    }

    setBusy(true);
    try {
      await onSave(num);
      onClose();
    } catch {
      showToast("Failed to update balance", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal balance-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="modal-header">
          <h2 className="modal-title">Set Account Balance</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="form-group">
          <label className="form-label">Initial Account Balance</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="10000.00"
            autoFocus
          />
          <div className="form-hint">
            This is your starting balance. P/L from trades will be added to this amount.
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} disabled={busy}>Cancel</button>
          <button className="primary" onClick={handleSave} disabled={busy}>
            {busy ? "Saving..." : "Save Balance"}
          </button>
        </div>
      </div>
    </div>
  );
}
