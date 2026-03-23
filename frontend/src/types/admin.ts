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
