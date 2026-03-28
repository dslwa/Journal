import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiLogin, apiRegister } from '@/api/client';
import { AxiosError } from 'axios';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');

    try {
      const res =
        mode === 'login'
          ? await apiLogin(email, password)
          : await apiRegister(username, email, password);

      localStorage.setItem('jwt', res.data.token);
      navigate('/dashboard');
    } catch (e: unknown) {
      const axErr = e as AxiosError<{ message?: string }>;
      setErr(
        axErr?.response?.data?.message ??
          axErr?.message ??
          'Failed to authenticate. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-5">
      <div className="w-full max-w-[440px] bg-panel rounded-2xl p-10 shadow-2xl border border-border-primary animate-[slideUp_0.4s_ease-out]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-brand"
            >
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h1 className="text-[28px] font-extrabold text-slate-100 mb-2">
            Trading Journal
          </h1>
          <p className="text-[15px] text-slate-400">
            Track and analyze your trading performance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all
                ${
                  mode === m
                    ? 'bg-panel text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              onClick={() => setMode(m)}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Username
              </label>
              <input
                className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
                  rounded-lg text-sm outline-none transition-all
                  focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-100 mb-2">
              Email
            </label>
            <input
              className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5
                rounded-lg text-sm outline-none transition-all
                focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-100">
                Password
              </label>
              {mode === 'login' && (
                <Link to="/forgot-password" className="text-[13px] font-medium text-brand hover:text-brand-hover">
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                className="w-full bg-surface border border-border-primary text-slate-100 px-3.5 py-2.5 pr-16
                  rounded-lg text-sm outline-none transition-all
                  focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
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

          {err && (
            <div className="p-3 rounded-lg bg-danger-bg border border-red-500/30 text-red-300 text-sm mb-5 animate-[slideUp_0.2s_ease-out]">
              {err}
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
                Processing...
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-slate-400">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                className="text-brand hover:text-brand-hover font-medium"
                onClick={() => setMode('register')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className="text-brand hover:text-brand-hover font-medium"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
