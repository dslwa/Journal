import axios from 'axios';
import type {
  Trade, Playbook, Attachment, UUID, JournalEntry,
  MacroEvent, AdminUser, SystemStats, SystemConfigEntry,
  MeResponse, PriceResponse,
} from '@/types';

const ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';

const api = axios.create({
  baseURL: `${ORIGIN}/api`,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('jwt');
      if (!location.pathname.startsWith('/login') && location.pathname !== '/') {
        location.href = '/';
      }
    }
    return Promise.reject(err);
  },
);

export default api;

/** Build full file URL (handles both absolute and relative paths) */
export const fileUrl = (path: string) =>
  path.startsWith('http') ? path : `${ORIGIN}${path}`;

// ── Auth ──────────────────────────────────────────
export const apiLogin = (email: string, password: string) =>
  api.post<{ token: string }>('/auth/login', { email, password });

export const apiRegister = (username: string, email: string, password: string) =>
  api.post<{ token: string }>('/auth/register', { username, email, password });

export const apiForgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const apiResetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

// ── User ──────────────────────────────────────────
export const apiMe = () => api.get<MeResponse>('/me');

export const apiUpdateBalance = (initialBalance: number) =>
  api.put<MeResponse>('/users/balance', { initialBalance });

// ── Trades ────────────────────────────────────────
export const apiListTrades = () => api.get<Trade[]>('/trades');

export const apiCreateTrade = (dto: Partial<Trade>) =>
  api.post<Trade>('/trades', dto);

export const apiUpdateTrade = (id: UUID, dto: Partial<Trade>) =>
  api.put<Trade>(`/trades/${id}`, dto);

export const apiDeleteTrade = (id: UUID) => api.delete(`/trades/${id}`);

// ── Attachments ───────────────────────────────────
export const apiListAttachments = (tradeId: UUID) =>
  api.get<Attachment[]>(`/trades/${tradeId}/attachments`);

export const apiUploadAttachments = (tradeId: UUID, files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  return api.post<Attachment[]>(`/trades/${tradeId}/attachments`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const apiDeleteAttachment = (tradeId: UUID, attId: UUID) =>
  api.delete(`/trades/${tradeId}/attachments/${attId}`);

// ── Playbook ──────────────────────────────────────
export const apiListPlaybook = () => api.get<Playbook[]>('/playbook');

export const apiCreatePlaybook = (dto: Partial<Playbook>) =>
  api.post<Playbook>('/playbook', dto);

export const apiUpdatePlaybook = (id: UUID, dto: Partial<Playbook>) =>
  api.put<Playbook>(`/playbook/${id}`, dto);

export const apiDeletePlaybook = (id: UUID) => api.delete(`/playbook/${id}`);

export const apiUploadPlaybookImage = (id: UUID, image: File) => {
  const fd = new FormData();
  fd.append('image', image);
  return api.post<{ imageUrl: string }>(`/playbook/${id}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Journal ───────────────────────────────────────
export const apiListJournalEntries = (from?: string, to?: string) => {
  const params = from && to ? { from, to } : {};
  return api.get<JournalEntry[]>('/journal', { params });
};

export const apiGetJournalByDate = (date: string) =>
  api.get<JournalEntry>(`/journal/${date}`);

export const apiSaveJournalEntry = (dto: Partial<JournalEntry>) =>
  api.post<JournalEntry>('/journal', dto);

export const apiDeleteJournalEntry = (date: string) =>
  api.delete(`/journal/${date}`);

// ── Macro Events ──────────────────────────────────
export const apiGetMacroEvents = (from: string, to: string) =>
  api.get<MacroEvent[]>('/macro-events', { params: { from, to } });

// ── Admin ─────────────────────────────────────────
export const apiAdminListUsers = () => api.get<AdminUser[]>('/admin/users');

export const apiAdminDisableUser = (id: string) =>
  api.put(`/admin/users/${id}/disable`);

export const apiAdminDeleteUser = (id: string) =>
  api.delete(`/admin/users/${id}`);

export const apiAdminResetPassword = (id: string, newPassword: string) =>
  api.post(`/admin/users/${id}/reset-password`, { newPassword });

export const apiAdminGetStats = () => api.get<SystemStats>('/admin/stats');

export const apiAdminGetConfig = () =>
  api.get<SystemConfigEntry[]>('/admin/config');

export const apiAdminUpdateConfig = (entries: SystemConfigEntry[]) =>
  api.put('/admin/config', entries);

// ── Market Data ───────────────────────────────────
export const apiGetPrice = (symbol: string) =>
  api.get<PriceResponse>(`/market/price/${symbol}`);
