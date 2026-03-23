import { useEffect, useState } from 'react';
import {
  apiAdminListUsers, apiAdminDisableUser, apiAdminDeleteUser,
  apiAdminResetPassword, apiAdminGetStats, apiAdminGetConfig, apiAdminUpdateConfig
} from '@/api/client';
import type { AdminUser, SystemStats, SystemConfigEntry } from '@/types';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmDialog';

type Tab = 'users' | 'stats' | 'config';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [config, setConfig] = useState<SystemConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => { loadTab(); }, [tab]);

  useEffect(() => {
    if (!resetPasswordUserId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResetPasswordUserId(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resetPasswordUserId]);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const res = await apiAdminListUsers();
        setUsers(res.data);
      } else if (tab === 'stats') {
        const res = await apiAdminGetStats();
        setStats(res.data);
      } else {
        const res = await apiAdminGetConfig();
        setConfig(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (id: string, username: string, disabled: boolean) => {
    const action = disabled ? 'enable' : 'disable';
    const confirmed = await confirm({
      title: `${disabled ? 'Enable' : 'Disable'} User?`,
      message: `Are you sure you want to ${action} "${username}"?`,
      confirmText: disabled ? 'Enable' : 'Disable',
      confirmVariant: disabled ? 'primary' : 'danger',
    });
    if (!confirmed) return;
    try {
      await apiAdminDisableUser(id);
      await loadTab();
      showToast(`User "${username}" ${action}d`);
    } catch {
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    const confirmed = await confirm({
      title: 'Delete User?',
      message: `Delete user "${username}" and ALL their data? This cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await apiAdminDeleteUser(id);
      await loadTab();
      showToast(`User "${username}" deleted`);
    } catch {
      showToast('Failed to delete user', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword) return;
    try {
      await apiAdminResetPassword(resetPasswordUserId, newPassword);
      setResetPasswordUserId(null);
      setNewPassword('');
      showToast('Password reset successfully');
    } catch {
      showToast('Failed to reset password', 'error');
    }
  };

  const handleConfigSave = async () => {
    try {
      await apiAdminUpdateConfig(config);
      await loadTab();
      showToast('Configuration saved');
    } catch {
      showToast('Failed to save configuration', 'error');
    }
  };

  const handleAddConfig = () => {
    if (!newConfigKey.trim()) return;
    setConfig([...config, { key: newConfigKey.trim(), value: newConfigValue }]);
    setNewConfigKey('');
    setNewConfigValue('');
  };

  const updateConfigValue = (key: string, value: string) => {
    setConfig(config.map(c => c.key === key ? { ...c, value } : c));
  };

  if (loading && tab === 'users' && users.length === 0) {
    return (
      <Layout>
        <div className="page-container">
          <div className="page-loader"><div className="spinner" />Loading admin panel...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage users, view statistics, and configure the system</p>
        </header>

        <div className="admin-tab-bar">
          {(['users', 'stats', 'config'] as Tab[]).map(t => (
            <button
              key={t}
              className={`admin-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'users' ? 'Users' : t === 'stats' ? 'Statistics' : 'Config'}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="admin-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Trades</th>
                    <th>Journal</th>
                    <th>Last Trade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="td-ticker">{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`admin-role-badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.tradeCount}</td>
                      <td>{user.journalEntryCount}</td>
                      <td>
                        {user.lastTradeAt
                          ? new Date(user.lastTradeAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '-'}
                      </td>
                      <td>
                        <span className={`admin-status-badge ${user.disabled ? 'disabled' : 'active'}`}>
                          {user.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-action-btn" onClick={() => handleDisable(user.id, user.username, user.disabled)}>
                            {user.disabled ? 'Enable' : 'Disable'}
                          </button>
                          <button className="admin-action-btn" onClick={() => { setResetPasswordUserId(user.id); setNewPassword(''); }}>
                            Reset PW
                          </button>
                          <button className="admin-action-btn danger" onClick={() => handleDelete(user.id, user.username)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'stats' && stats && (
          <div className="admin-metrics-grid">
            <div className="admin-metric-card">
              <div className="admin-metric-label">Total Users</div>
              <div className="admin-metric-value">{stats.totalUsers}</div>
            </div>
            <div className="admin-metric-card">
              <div className="admin-metric-label">Active Users (30d)</div>
              <div className="admin-metric-value">{stats.activeUsers}</div>
            </div>
            <div className="admin-metric-card">
              <div className="admin-metric-label">Total Trades</div>
              <div className="admin-metric-value">{stats.totalTrades}</div>
            </div>
            <div className="admin-metric-card">
              <div className="admin-metric-label">Journal Entries</div>
              <div className="admin-metric-value">{stats.totalJournalEntries}</div>
            </div>
            <div className="admin-metric-card">
              <div className="admin-metric-label">Avg Trades / User</div>
              <div className="admin-metric-value">{stats.avgTradesPerUser.toFixed(1)}</div>
            </div>
          </div>
        )}

        {tab === 'config' && (
          <div className="admin-card">
            <div style={{ marginBottom: 16 }}>
              {config.map(entry => (
                <div key={entry.key} className="admin-config-row">
                  <label className="admin-config-key">{entry.key}</label>
                  <input
                    className="admin-config-input"
                    value={entry.value}
                    onChange={e => updateConfigValue(entry.key, e.target.value)}
                  />
                </div>
              ))}
              <div className="admin-config-row admin-config-divider">
                <input className="admin-config-input" style={{ flex: '0 0 200px' }} placeholder="New key" value={newConfigKey} onChange={e => setNewConfigKey(e.target.value)} />
                <input className="admin-config-input" placeholder="Value" value={newConfigValue} onChange={e => setNewConfigValue(e.target.value)} />
                <button className="admin-action-btn" onClick={handleAddConfig}>Add</button>
              </div>
            </div>
            <button className="primary" onClick={handleConfigSave}>Save Configuration</button>
          </div>
        )}

        {resetPasswordUserId && (
          <div className="modal-backdrop" onClick={() => setResetPasswordUserId(null)}>
            <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <h3 className="modal-title">Reset Password</h3>
              <p className="form-hint" style={{ marginBottom: 12 }}>
                User: {users.find(u => u.id === resetPasswordUserId)?.username}
              </p>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="modal-footer">
                <button onClick={() => setResetPasswordUserId(null)}>Cancel</button>
                <button className="primary" onClick={handleResetPassword} disabled={newPassword.length < 8}>Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
