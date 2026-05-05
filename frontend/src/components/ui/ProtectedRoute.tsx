import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

// Wrapper chroniący zagnieżdżone strony przed nieautoryzowanym dostępem.
// Bez tokenu w localStorage przekierowuje na stronę logowania ("/")
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('jwt');
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}
