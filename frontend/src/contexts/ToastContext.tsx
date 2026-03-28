import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const iconMap = { success: '\u2713', error: '\u2715', info: '\u2139' };
  const borderMap = {
    success: 'border-emerald-500/40',
    error: 'border-red-500/40',
    info: 'border-blue-500/40',
  };
  const iconColorMap = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-[3000] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg
                bg-panel border ${borderMap[t.type]} shadow-lg text-sm font-medium text-slate-100
                min-w-[260px] max-w-[400px] animate-[slideInRight_0.25s_ease-out]`}
            >
              <span className={`text-base font-bold shrink-0 ${iconColorMap[t.type]}`}>
                {iconMap[t.type]}
              </span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-300 px-1 rounded"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
