import api from './api';

const API_URL = 'api/auth'; // Ścieżka bez ukośnika na początku

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
}

const register = (data: RegisterRequest) => {
  console.log("AuthService - wysyłane dane rejestracji:", data);
  return api.post<AuthResponse>(`${API_URL}/register`, data);
};

const login = (data: LoginRequest) => {
  return api.post<AuthResponse>(`${API_URL}/login`, data);
};

const authService = {
  register,
  login,
};

export default authService;
