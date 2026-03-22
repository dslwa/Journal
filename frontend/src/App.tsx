import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaybooksPage from './pages/PlaybooksPage';
import TradesPage from './pages/TradesPage';
import { AuthProvider } from './context/AuthContext';
import { PlaybookProvider } from './context/PlaybookContext';
import { TradeProvider } from './context/TradeContext';
import PrivateRoute from './components/PrivateRoute';
import theme from './theme';

function App() {
  console.log('App component rendering...');
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <PlaybookProvider>
            <TradeProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<Layout />}>
                  <Route element={<PrivateRoute />}>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/playbooks" element={<PlaybooksPage />} />
                    <Route path="/trades" element={<TradesPage />} />
                  </Route>
                </Route>
              </Routes>
            </TradeProvider>
          </PlaybookProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
