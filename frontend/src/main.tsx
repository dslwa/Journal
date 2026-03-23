import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import App from './App'
import AuthPage from './pages/AuthPage'
// import ForgotPasswordPage from './pages/ForgotPasswordPage'
// import ResetPasswordPage from './pages/ResetPasswordPage'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import { ConfirmProvider } from './components/ConfirmDialog'

import './styles.css'

// Lazy-loaded pages (heavy deps: recharts, react-markdown)
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
// const CalendarPage = React.lazy(() => import('./pages/CalendarPage'))
// const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'))
const PlaybookPage = React.lazy(() => import('./pages/PlaybookPage'))
// const JournalPage = React.lazy(() => import('./pages/JournalPage'))
// const AdminPage = React.lazy(() => import('./pages/AdminPage'))

function PageLoader() {
  return (
    <div className="page-loader" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
      Loading...
    </div>
  )
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
                {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                {/* <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            /> */}
                {/* <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            /> */}
                {/* <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <JournalPage />
                </ProtectedRoute>
              }
            /> */}
                <Route
                  path="/playbook"
                  element={
                    <ProtectedRoute>
                      <PlaybookPage />
                    </ProtectedRoute>
                  }
                />
                {/* <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            /> */}
                <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
