export interface MacroEvent {
  id: string;
  eventName: string;
  eventDate: string; // ISO date
  eventTime: string | null; // "HH:mm"
  country: string | null;
  impact: string | null; // "High", "Medium", "Low"
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  currency: string | null;
}
