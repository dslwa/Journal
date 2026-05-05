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

// Pomocnicza — opóźnienie w milisekundach (do exponential backoff przy retry)
const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

// Decyduje czy błąd nadaje się do automatycznej retransmisji.
// Tylko żądania GET z błędami 502/503/504 lub błędami sieci (np. backend wstaje na Railway)
const isRetryableStartupError = (err: AxiosError) => {
  const config = err.config as RetryableRequestConfig | undefined;
  const method = config?.method?.toLowerCase();
  if (!config || method !== 'get') return false;

  const status = err.response?.status;
  return RETRYABLE_STATUSES.has(status ?? 0) || err.code === 'ERR_NETWORK' || !err.response;
};

// Interceptor żądań — automatycznie dołącza token JWT z localStorage do każdego wywołania API
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor odpowiedzi — auto-wylogowanie przy 401 (wygasły token)
// oraz automatyczna retransmisja 5xx/network errors z rosnącym opóźnieniem (max 3 próby)
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

// Buduje pełny URL pliku — obsługuje zarówno bezwzględne (http://...) jak i względne (/files/...)
export const fileUrl = (path: string) =>
  path.startsWith('http') ? path : `${ORIGIN}${path}`;

// --- Autoryzacja ---
// Logowanie email + hasło, zwraca token JWT
export const apiLogin = (email: string, password: string) =>
  api.post<{ token: string }>('/auth/login', { email, password });

// Rejestracja nowego konta, zwraca token JWT
export const apiRegister = (username: string, email: string, password: string) =>
  api.post<{ token: string }>('/auth/register', { username, email, password });

// Inicjuje proces resetu hasła (backend wysyła email z linkiem)
export const apiForgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

// Finalizuje reset hasła przy użyciu tokenu jednorazowego z emaila
export const apiResetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

// --- Profil użytkownika ---
// Pobiera profil zalogowanego użytkownika
export const apiMe = () => api.get<MeResponse>('/me');

// Aktualizuje saldo początkowe konta (wartość referencyjna do P&L)
export const apiUpdateBalance = (initialBalance: number) =>
  api.put<MeResponse>('/users/balance', { initialBalance });

// --- Transakcje ---
// Lista wszystkich transakcji użytkownika
export const apiListTrades = () => api.get<Trade[]>('/trades');

// Tworzy nową transakcję
export const apiCreateTrade = (dto: Partial<Trade>) =>
  api.post<Trade>('/trades', dto);

// Aktualizuje istniejącą transakcję
export const apiUpdateTrade = (id: UUID, dto: Partial<Trade>) =>
  api.put<Trade>(`/trades/${id}`, dto);

// Usuwa transakcję wraz z jej załącznikami
export const apiDeleteTrade = (id: UUID) => api.delete(`/trades/${id}`);

// --- Załączniki transakcji ---
// Lista załączników (zrzutów wykresu) danej transakcji
export const apiListAttachments = (tradeId: UUID) =>
  api.get<Attachment[]>(`/trades/${tradeId}/attachments`);

// Wgrywa pliki graficzne (multipart/form-data) jako załączniki transakcji
export const apiUploadAttachments = (tradeId: UUID, files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  return api.post<Attachment[]>(`/trades/${tradeId}/attachments`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Usuwa pojedynczy załącznik z transakcji
export const apiDeleteAttachment = (tradeId: UUID, attId: UUID) =>
  api.delete(`/trades/${tradeId}/attachments/${attId}`);

// --- Playbook (strategie) ---
// Lista wszystkich strategii użytkownika
export const apiListPlaybook = () => api.get<Playbook[]>('/playbooks');

// Tworzy nową strategię
export const apiCreatePlaybook = (dto: Partial<Playbook>) =>
  api.post<Playbook>('/playbooks', dto);

// Aktualizuje istniejącą strategię
export const apiUpdatePlaybook = (id: UUID, dto: Partial<Playbook>) =>
  api.put<Playbook>(`/playbooks/${id}`, dto);

// Usuwa strategię
export const apiDeletePlaybook = (id: UUID) => api.delete(`/playbooks/${id}`);

// Wgrywa obraz ilustracyjny do strategii
export const apiUploadPlaybookImage = (id: UUID, image: File) => {
  const fd = new FormData();
  fd.append('image', image);
  return api.post<{ imageUrl: string }>(`/playbooks/${id}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- Long Term (planowanie strategiczne) ---
// Lista wszystkich wpisów długoterminowych
export const apiListLongTermEntries = () => api.get<LongTermEntry[]>('/long-term');

// Tworzy nowy wpis długoterminowy (THEME / WATCHLIST / GOAL / REVIEW)
export const apiCreateLongTermEntry = (dto: Partial<LongTermEntry>) =>
  api.post<LongTermEntry>('/long-term', dto);

// Aktualizuje istniejący wpis długoterminowy
export const apiUpdateLongTermEntry = (id: UUID, dto: Partial<LongTermEntry>) =>
  api.put<LongTermEntry>(`/long-term/${id}`, dto);

// Usuwa wpis długoterminowy
export const apiDeleteLongTermEntry = (id: UUID) =>
  api.delete(`/long-term/${id}`);

// --- Dziennik psychologiczny ---
// Lista wpisów dziennika (opcjonalnie zawężona do zakresu dat)
export const apiListJournalEntries = (from?: string, to?: string) => {
  const params = from && to ? { from, to } : {};
  return api.get<JournalEntry[]>('/journal', { params });
};

// Pobiera wpis dziennika dla konkretnej daty
export const apiGetJournalByDate = (date: string) =>
  api.get<JournalEntry>(`/journal/${date}`);

// Upsert wpisu dziennika (tworzy lub aktualizuje dla danej daty)
export const apiSaveJournalEntry = (dto: Partial<JournalEntry>) =>
  api.post<JournalEntry>('/journal', dto);

// Usuwa wpis dziennika z wybranej daty
export const apiDeleteJournalEntry = (date: string) =>
  api.delete(`/journal/${date}`);

// --- Wydarzenia makroekonomiczne ---
// Pobiera wydarzenia makro (ForexFactory) z zakresu dat dla kalendarza
export const apiGetMacroEvents = (from: string, to: string) =>
  api.get<MacroEvent[]>('/macro-events', { params: { from, to } });

// --- Panel admina ---
// Lista wszystkich użytkowników systemu wraz ze statystykami
export const apiAdminListUsers = () => api.get<AdminUser[]>('/admin/users');

// Blokuje/odblokowuje konto wybranego użytkownika
export const apiAdminDisableUser = (id: string) =>
  api.put(`/admin/users/${id}/disable`);

// Trwale usuwa konto użytkownika
export const apiAdminDeleteUser = (id: string) =>
  api.delete(`/admin/users/${id}`);

// Awaryjny reset hasła użytkownika z poziomu admina
export const apiAdminResetPassword = (id: string, newPassword: string) =>
  api.post(`/admin/users/${id}/reset-password`, { newPassword });

// Zagregowane statystyki systemu (liczba kont, transakcji itp.)
export const apiAdminGetStats = () => api.get<SystemStats>('/admin/stats');

// Pobiera wpisy konfiguracji systemowej (klucz–wartość)
export const apiAdminGetConfig = () =>
  api.get<SystemConfigEntry[]>('/admin/config');

// Masowy zapis konfiguracji systemowej (upsert)
export const apiAdminUpdateConfig = (entries: SystemConfigEntry[]) =>
  api.put('/admin/config', entries);

// --- Dane rynkowe ---
// Pobiera aktualną cenę instrumentu (proxy do Finnhub/ExchangeRate-API)
export const apiGetPrice = (symbol: string) =>
  api.get<PriceResponse>(`/market/price/${symbol}`);
