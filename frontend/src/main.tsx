import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import App from './App';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

import './index.css';

// Lazy-loaded pages (heavy deps: recharts, react-markdown)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const PlaybookPage = React.lazy(() => import('./pages/PlaybookPage'));
const JournalPage = React.lazy(() => import('./pages/JournalPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const ChartPage = React.lazy(() => import('./pages/ChartPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-3 text-slate-400">
      <div className="spinner" />
      Loading...
    </div>
  );
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<App />}>
                  <Route path="/" element={<AuthPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
                  <Route path="/calendar" element={<ProtectedPage><CalendarPage /></ProtectedPage>} />
                  <Route path="/analytics" element={<ProtectedPage><AnalyticsPage /></ProtectedPage>} />
                  <Route path="/journal" element={<ProtectedPage><JournalPage /></ProtectedPage>} />
                  <Route path="/playbook" element={<ProtectedPage><PlaybookPage /></ProtectedPage>} />
                  <Route path="/chart" element={<ProtectedPage><ChartPage /></ProtectedPage>} />
                  <Route path="/admin" element={<ProtectedPage><AdminPage /></ProtectedPage>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
