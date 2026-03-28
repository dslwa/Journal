import { useEffect, useState } from 'react';
import {
  apiAdminListUsers, apiAdminDisableUser, apiAdminDeleteUser,
  apiAdminResetPassword, apiAdminGetStats, apiAdminGetConfig, apiAdminUpdateConfig,
} from '@/api/client';
import type { AdminUser, SystemStats, SystemConfigEntry } from '@/types';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

type Tab = 'users' | 'stats' | 'config';

const inputCls = `w-full bg-surface border border-border-primary text-slate-100 px-3 py-2.5
  rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500`;

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
  useEscapeKey(resetPasswordUserId ? () => setResetPasswordUserId(null) : null);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === 'users') { setUsers((await apiAdminListUsers()).data); }
      else if (tab === 'stats') { setStats((await apiAdminGetStats()).data); }
      else { setConfig((await apiAdminGetConfig()).data); }
    } finally { setLoading(false); }
  };

  const handleDisable = async (id: string, username: string, disabled: boolean) => {
    const action = disabled ? 'enable' : 'disable';
    const confirmed = await confirm({ title: `${disabled ? 'Enable' : 'Disable'} User?`, message: `Are you sure you want to ${action} "${username}"?`, confirmText: disabled ? 'Enable' : 'Disable', confirmVariant: disabled ? 'primary' : 'danger' });
    if (!confirmed) return;
    try { await apiAdminDisableUser(id); await loadTab(); showToast(`User "${username}" ${action}d`); }
    catch { showToast(`Failed to ${action} user`, 'error'); }
  };

  const handleDelete = async (id: string, username: string) => {
    const confirmed = await confirm({ title: 'Delete User?', message: `Delete user "${username}" and ALL their data? This cannot be undone.`, confirmText: 'Delete', confirmVariant: 'danger' });
    if (!confirmed) return;
    try { await apiAdminDeleteUser(id); await loadTab(); showToast(`User "${username}" deleted`); }
    catch { showToast('Failed to delete user', 'error'); }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword) return;
    try { await apiAdminResetPassword(resetPasswordUserId, newPassword); setResetPasswordUserId(null); setNewPassword(''); showToast('Password reset successfully'); }
    catch { showToast('Failed to reset password', 'error'); }
  };

  const handleConfigSave = async () => {
    try { await apiAdminUpdateConfig(config); await loadTab(); showToast('Configuration saved'); }
    catch { showToast('Failed to save configuration', 'error'); }
  };

  const handleAddConfig = () => {
    if (!newConfigKey.trim()) return;
    setConfig([...config, { key: newConfigKey.trim(), value: newConfigValue }]);
    setNewConfigKey(''); setNewConfigValue('');
  };

  const updateConfigValue = (key: string, value: string) =>
    setConfig(config.map(c => c.key === key ? { ...c, value } : c));

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Admin Panel</h1>
        <p className="text-sm text-slate-400 mt-1">Manage users, view statistics, and configure the system</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit">
        {([['users', 'Users'], ['stats', 'Statistics'], ['config', 'Config']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all
              ${tab === t ? 'bg-panel text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
          <div className="spinner" /> Loading...
        </div>
      ) : (
        <>
          {/* Users tab */}
          {tab === 'users' && (
            <div className="bg-panel rounded-xl border border-border-primary overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-primary text-left">
                      {['Username', 'Email', 'Role', 'Trades', 'Journal', 'Last Trade', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-surface-secondary/50">
                        <td className="px-4 py-3 font-semibold text-slate-100">{user.username}</td>
                        <td className="px-4 py-3 text-slate-300">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase
                            ${user.role === 'ADMIN' ? 'bg-brand/15 text-brand' : 'bg-surface-secondary text-slate-400'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{user.tradeCount}</td>
                        <td className="px-4 py-3 text-slate-300">{user.journalEntryCount}</td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {user.lastTradeAt ? new Date(user.lastTradeAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold
                            ${user.disabled ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'}`}>
                            {user.disabled ? 'Disabled' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleDisable(user.id, user.username, user.disabled)}
                              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 border border-border-primary rounded">
                              {user.disabled ? 'Enable' : 'Disable'}
                            </button>
                            <button onClick={() => { setResetPasswordUserId(user.id); setNewPassword(''); }}
                              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 border border-border-primary rounded">
                              Reset PW
                            </button>
                            <button onClick={() => handleDelete(user.id, user.username)}
                              className="text-xs text-danger hover:text-red-300 px-2 py-1 border border-danger/30 rounded">
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

          {/* Stats tab */}
          {tab === 'stats' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                ['Total Users', stats.totalUsers],
                ['Active Users (30d)', stats.activeUsers],
                ['Total Trades', stats.totalTrades],
                ['Journal Entries', stats.totalJournalEntries],
                ['Avg Trades / User', stats.avgTradesPerUser.toFixed(1)],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-panel rounded-xl border border-border-primary p-5">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</div>
                  <div className="text-2xl font-bold text-slate-100">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Config tab */}
          {tab === 'config' && (
            <div className="bg-panel rounded-xl border border-border-primary p-6">
              <div className="space-y-3 mb-6">
                {config.map(entry => (
                  <div key={entry.key} className="flex items-center gap-3">
                    <label className="text-sm text-slate-300 font-medium min-w-[200px]">{entry.key}</label>
                    <input className={inputCls} value={entry.value} onChange={e => updateConfigValue(entry.key, e.target.value)} />
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-3 border-t border-border-primary">
                  <input className={`${inputCls} !w-[200px] flex-none`} placeholder="New key" value={newConfigKey} onChange={e => setNewConfigKey(e.target.value)} />
                  <input className={inputCls} placeholder="Value" value={newConfigValue} onChange={e => setNewConfigValue(e.target.value)} />
                  <button onClick={handleAddConfig}
                    className="px-3 py-2.5 text-sm border border-border-primary rounded-lg text-slate-300 hover:bg-surface-secondary whitespace-nowrap">
                    Add
                  </button>
                </div>
              </div>
              <button onClick={handleConfigSave}
                className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors">
                Save Configuration
              </button>
            </div>
          )}
        </>
      )}

      {/* Reset password modal */}
      {resetPasswordUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]" onClick={() => setResetPasswordUserId(null)}>
          <div className="bg-panel border border-border-primary rounded-2xl p-6 w-full max-w-[400px] shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Reset Password</h3>
            <p className="text-sm text-slate-400 mb-4">
              User: {users.find(u => u.id === resetPasswordUserId)?.username}
            </p>
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                className={inputCls}
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoFocus
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-2 py-1">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setResetPasswordUserId(null)}
                className="px-4 py-2.5 rounded-lg border border-border-primary text-slate-100 text-sm font-medium hover:bg-surface-secondary">
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={newPassword.length < 8}
                className="px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
