import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  Trade, Playbook, Attachment, UUID, JournalEntry,
  MacroEvent, AdminUser, SystemStats, SystemConfigEntry,
  MeResponse, PriceResponse, LongTermEntry,
} from '@/types';

const ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';

const api = axios.create({
  baseURL: `${ORIGIN}/api`,
});

const MAX_STARTUP_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
};

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const isRetryableStartupError = (err: AxiosError) => {
  const config = err.config as RetryableRequestConfig | undefined;
  const method = config?.method?.toLowerCase();
  if (!config || method !== 'get') return false;

  const status = err.response?.status;
  return RETRYABLE_STATUSES.has(status ?? 0) || err.code === 'ERR_NETWORK' || !err.response;
};

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
  async (err: AxiosError) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('jwt');
      if (!location.pathname.startsWith('/login') && location.pathname !== '/') {
        location.href = '/';
      }
    }

    if (isRetryableStartupError(err)) {
      const config = err.config as RetryableRequestConfig;
      config._retryCount = (config._retryCount ?? 0) + 1;

      if (config._retryCount <= MAX_STARTUP_RETRIES) {
        await wait(config._retryCount * 700);
        return api.request(config);
      }
    }

    return Promise.reject(err);
  },
);

export default api;

/** Build full file URL (handles both absolute and relative paths) */
export const fileUrl = (path: string) =>
  path.startsWith('http') ? path : `${ORIGIN}${path}`;

export const apiLogin = (email: string, password: string) =>
  api.post<{ token: string }>('/auth/login', { email, password });

export const apiRegister = (username: string, email: string, password: string) =>
  api.post<{ token: string }>('/auth/register', { username, email, password });

export const apiForgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const apiResetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

export const apiMe = () => api.get<MeResponse>('/me');

export const apiUpdateBalance = (initialBalance: number) =>
  api.put<MeResponse>('/users/balance', { initialBalance });

export const apiListTrades = () => api.get<Trade[]>('/trades');

export const apiCreateTrade = (dto: Partial<Trade>) =>
  api.post<Trade>('/trades', dto);

export const apiUpdateTrade = (id: UUID, dto: Partial<Trade>) =>
  api.put<Trade>(`/trades/${id}`, dto);

export const apiDeleteTrade = (id: UUID) => api.delete(`/trades/${id}`);

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

export const apiListPlaybook = () => api.get<Playbook[]>('/playbooks');

export const apiCreatePlaybook = (dto: Partial<Playbook>) =>
  api.post<Playbook>('/playbooks', dto);

export const apiUpdatePlaybook = (id: UUID, dto: Partial<Playbook>) =>
  api.put<Playbook>(`/playbooks/${id}`, dto);

export const apiDeletePlaybook = (id: UUID) => api.delete(`/playbooks/${id}`);

export const apiUploadPlaybookImage = (id: UUID, image: File) => {
  const fd = new FormData();
  fd.append('image', image);
  return api.post<{ imageUrl: string }>(`/playbooks/${id}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const apiListLongTermEntries = () => api.get<LongTermEntry[]>('/long-term');

export const apiCreateLongTermEntry = (dto: Partial<LongTermEntry>) =>
  api.post<LongTermEntry>('/long-term', dto);

export const apiUpdateLongTermEntry = (id: UUID, dto: Partial<LongTermEntry>) =>
  api.put<LongTermEntry>(`/long-term/${id}`, dto);

export const apiDeleteLongTermEntry = (id: UUID) =>
  api.delete(`/long-term/${id}`);

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

export const apiGetMacroEvents = (from: string, to: string) =>
  api.get<MacroEvent[]>('/macro-events', { params: { from, to } });

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

export const apiGetPrice = (symbol: string) =>
  api.get<PriceResponse>(`/market/price/${symbol}`);
