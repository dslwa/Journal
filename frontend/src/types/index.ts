export type UUID = string;

// Auth
export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

// User
export interface MeResponse {
  id: UUID;
  username: string;
  email: string;
  initialBalance?: number;
  role?: string;
}

// Trade
export interface Attachment {
  id: UUID;
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface Trade {
  id: UUID;
  ticker: string;
  entryPrice: number | null;
  exitPrice: number | null;
  positionSize: number | null;
  openedAt: string;
  closedAt: string | null;
  notes?: string | null;
  tags?: string | null;
  rating?: number | null;
  riskPercent?: number | null;
  stopLoss?: number | null;
  emotionBefore?: string | null;
  emotionAfter?: string | null;
  preTradeChecklist?: string | null;
  postTradeReview?: string | null;
  playbookId?: UUID | null;
  playbookTitle?: string | null;
  attachments: Attachment[];
}

export interface ChecklistItem {
  label: string;
  checked: boolean;
}

// Playbook
export interface Playbook {
  id: UUID;
  title: string;
  description: string | null;
  content: string;
  tags: string | null;
  imageUrl: string | null;
  checklist: string | null;
  createdAt: string;
  updatedAt: string;
}

// Journal
export interface JournalEntry {
  id?: UUID;
  entryDate: string;
  mood: number | null;
  energy: number | null;
  notes: string;
  lessonsLearned: string;
  mistakes: string;
  createdAt?: string;
  updatedAt?: string;
}

// Macro Events
export interface MacroEvent {
  id: string;
  eventName: string;
  eventDate: string;
  eventTime: string | null;
  country: string | null;
  impact: string | null;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  currency: string | null;
}

// Admin
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  disabled: boolean;
  tradeCount: number;
  journalEntryCount: number;
  lastTradeAt: string | null;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTrades: number;
  totalJournalEntries: number;
  avgTradesPerUser: number;
}

export interface SystemConfigEntry {
  key: string;
  value: string;
}

// Market Data
export interface PriceResponse {
  symbol: string;
  price: number;
}
