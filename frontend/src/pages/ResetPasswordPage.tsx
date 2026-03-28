import { useState, useEffect, type FormEvent } from 'react';
import { apiResetPassword } from '@/api/client';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new password reset.');
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) { setError('Password must be at least 6 characters long'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid reset token'); return; }

    setLoading(true);
    try {
      await apiResetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: unknown) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-5">
        <div className="w-full max-w-[440px] bg-panel rounded-2xl p-10 shadow-2xl border border-border-primary text-center">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Password Reset Successful</h1>
          <p className="text-sm text-slate-400 mb-6">
            Your password has been successfully reset. Redirecting to login...
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-5">
      <div className="w-full max-w-[440px] bg-panel rounded-2xl p-10 shadow-2xl border border-border-primary">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Reset Password</h1>
          <p className="text-sm text-slate-400">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-100 mb-2">New Password</label>
            <div className="relative">
              <input
                className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5 pr-16
                  rounded-lg text-sm outline-none transition-all
                  focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                disabled={loading || !token}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-slate-400
                  hover:text-slate-200 font-medium px-2 py-1 rounded"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-100 mb-2">Confirm Password</label>
            <input
              className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
                rounded-lg text-sm outline-none transition-all
                focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
              disabled={loading || !token}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger-bg border border-red-500/30 text-red-300 text-sm mb-5">
              {error}
            </div>
          )}

          <button
            className="w-full py-3.5 bg-brand text-white rounded-lg text-[15px] font-semibold
              hover:bg-brand-hover transition-colors disabled:opacity-50"
            type="submit"
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-brand hover:text-brand-hover font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
