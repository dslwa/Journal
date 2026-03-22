import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Zaczynamy z ładowaniem
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthContext: Initializing status...');
    try {
      const token = localStorage.getItem('token');
      console.log('AuthContext: Token found:', !!token);
      if (token) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Błąd podczas sprawdzania statusu autentykacji:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('AuthContext: Initialization finished.');
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    // Przekieruj i wyczyść historię, aby użytkownik nie mógł "wrócić"
    navigate('/login', { replace: true });
  };

  const value = { isAuthenticated, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth musi być używany wewnątrz AuthProvider');
  }
  return context;
};