import { useState, FormEvent } from "react";
import { apiForgotPassword } from "@/api/client";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiForgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr?.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-header">
            <div className="auth-logo" style={{ fontSize: 48 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            The link will expire in 1 hour.
          </p>
          <Link to="/" className="primary" style={{ display: "inline-block", padding: "12px 24px", textDecoration: "none" }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            className="primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 600 }}
          >
            {loading ? <><span className="btn-spinner" /> Sending...</> : "Send Reset Link"}
          </button>
        </form>

        <div className="form-footer">
          <Link to="/">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
