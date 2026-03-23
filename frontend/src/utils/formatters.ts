export function formatCurrency(amount: number, showSign = false): string {
  const prefix = showSign && amount > 0 ? '+' : '';
  return `${prefix}$${amount.toFixed(2)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 16).replace('T', ' ');
}

export function fromLocalInputValue(local: string): string {
  if (!local) return '';
  const normalized = local.replace(' ', 'T');
  const d = new Date(normalized);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}
