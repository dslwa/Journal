import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('jwt');
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}
