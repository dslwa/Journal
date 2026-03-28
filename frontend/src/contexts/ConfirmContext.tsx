import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

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

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleResult = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    setOptions(null);
  }, []);

  useEffect(() => {
    if (options) confirmBtnRef.current?.focus();
  }, [options]);

  useEffect(() => {
    if (!options) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleResult(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, handleResult]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-[fadeIn_0.15s_ease-out]"
          onClick={() => handleResult(false)}
        >
          <div
            className="bg-panel border border-border-primary rounded-2xl p-7 max-w-[440px] w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              {options.title}
            </h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {options.message}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleResult(false)}
                className="px-4 py-2.5 rounded-lg border border-border-primary bg-panel text-slate-100 text-sm font-medium hover:bg-surface-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => handleResult(true)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  options.confirmVariant === 'danger'
                    ? 'bg-danger-bg border border-red-500/30 text-red-300 hover:bg-red-500/20'
                    : 'bg-brand border-brand text-white hover:bg-brand-hover'
                }`}
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
