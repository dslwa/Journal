import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import type { AuthResponse } from "../types/auth";
import { AxiosError } from "axios";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      let res;
      if (mode === "login") {
        res = await api.post<AuthResponse>("/auth/login", {
          email,
          password,
        });
      } else {
        res = await api.post<AuthResponse>("/auth/register", {
          username,
          email,
          password,
        });
      }
      localStorage.setItem("jwt", res.data.token);
      navigate("/dashboard");
    } catch (e: unknown) {
      const axiosErr = e as AxiosError<{ message?: string }>;
      const msg =
        axiosErr?.response?.data?.message ??
        axiosErr?.message ??
        "Failed to authenticate. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h1 className="auth-title">Trading Journal</h1>
          <p className="auth-subtitle">Track and analyze your trading performance</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === "login" ? " active" : ""}`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            className={`auth-tab${mode === "register" ? " active" : ""}`}
            onClick={() => setMode("register")}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "login" && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
          )}

          {mode === "register" && (
            <>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="input"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Password</label>
              {/* <Link to="/forgot-password" className="form-link">
                Forgot password?
              </Link> */}
            </div>
            <div className="password-wrapper">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {err && <div className="form-error">{err}</div>}

          <button
            className="primary auth-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Processing...</>
            ) : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="form-footer">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); }}>
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>
                Sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
