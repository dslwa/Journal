import { useState, type FormEvent } from 'react';
import { apiForgotPassword } from '@/api/client';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-5">
        <div className="w-full max-w-[440px] bg-panel rounded-2xl p-10 shadow-2xl border border-border-primary text-center">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-success">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Check Your Email</h1>
          <p className="text-sm text-slate-400 mb-6">
            We've sent a password reset link to <strong className="text-slate-200">{email}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-6">The link will expire in 1 hour.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-5">
      <div className="w-full max-w-[440px] bg-panel rounded-2xl p-10 shadow-2xl border border-border-primary">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Forgot Password</h1>
          <p className="text-sm text-slate-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-100 mb-2">Email Address</label>
            <input
              className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
                rounded-lg text-sm outline-none transition-all
                focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              autoFocus
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
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
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
