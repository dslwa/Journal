import { useEffect } from 'react';

// Hook nasłuchujący na klawisz Escape — używany w modalach do ich zamykania.
// Przekazanie null wyłącza listener (np. gdy modal jest zamknięty)
export function useEscapeKey(onEscape: (() => void) | null) {
  useEffect(() => {
    if (!onEscape) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape]);
}
