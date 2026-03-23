import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(value: boolean) => void>();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise(resolve => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleResult = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    setOptions(null);
  }, []);

  useEffect(() => {
    if (options) {
      confirmBtnRef.current?.focus();
    }
  }, [options]);

  useEffect(() => {
    if (!options) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleResult(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [options, handleResult]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="modal-backdrop" onClick={() => handleResult(false)}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-title">{options.title}</h3>
            <p className="confirm-message">{options.message}</p>
            <div className="confirm-actions">
              <button onClick={() => handleResult(false)}>Cancel</button>
              <button
                ref={confirmBtnRef}
                className={options.confirmVariant === 'danger' ? 'danger' : 'primary'}
                onClick={() => handleResult(true)}
              >
                {options.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
