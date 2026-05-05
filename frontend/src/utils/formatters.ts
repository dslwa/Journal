// Formatuje kwotę jako $X.XX. Z opcjonalnym znakiem + dla wartości dodatnich (P&L)
export function formatCurrency(amount: number, showSign = false): string {
  const prefix = showSign && amount > 0 ? '+' : '';
  return `${prefix}$${amount.toFixed(2)}`;
}

// Formatuje datę ISO na czytelny format "Mar 5, 2026" (locale en-US)
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Formatuje liczbę jako procent z jedną cyfrą po przecinku (np. "65.4%")
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Konwertuje ISO na "YYYY-MM-DD HH:mm" w czasie lokalnym — do wyświetlenia w inputach datetime
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 16).replace('T', ' ');
}

// Konwersja odwrotna — z formy lokalnej "YYYY-MM-DD HH:mm" na pełny ISO string z UTC
export function fromLocalInputValue(local: string): string {
  if (!local) return '';
  const normalized = local.replace(' ', 'T');
  const d = new Date(normalized);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}
