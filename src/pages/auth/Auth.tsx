import { logger } from '../../utils/logger';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import {
  signIn,
  signUp,
  signInWithGoogle,
  signInWithGoogleRedirect,
  resetPassword,
  getAuthErrorMessage,
} from '../../services/firebase/auth';
import { toast } from '../../components/ui';
import './Auth.css';

type Mode = 'signin' | 'signup' | 'reset';

export function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(() =>
    window.location.pathname.includes('signup') ? 'signup' : 'signin'
  );
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const set = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (mode === 'signup' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (mode !== 'reset') {
      if (!form.password) e.password = 'Password is required';
      else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    }
    if (mode === 'signup') {
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!form.terms) e.terms = 'You must accept the terms';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || loading) return;
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(form.email, form.password);
        navigate('/dashboard');
      } else if (mode === 'signup') {
        await signUp(form.email, form.password, form.name);
        navigate('/onboarding');
      } else {
        await resetPassword(form.email);
        setResetSent(true);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (loading) return;
    setLoading(true);
    setPopupBlocked(false);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      logger.warn('[Auth] Google sign-in failed with code:', code, err);
      if (code === 'auth/popup-blocked') {
        setPopupBlocked(true);
      }
      toast.error(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRedirect() {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(getAuthErrorMessage(code));
      setLoading(false);
    }
  }

  if (mode === 'reset' && resetSent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand-wrap">
            <img
              src="/assets/branding/celebrai-icon.png"
              alt="CelebrAI"
              className="auth-reset-icon"
            />
          </div>
          <h2 className="auth-title font-serif">Check your email</h2>
          <p className="auth-subtitle">
            We sent a password reset link to <strong>{form.email}</strong>.
            Check your inbox and follow the instructions.
          </p>
          <button className="btn btn-primary w-full" onClick={() => { setMode('signin'); setResetSent(false); }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-decor" />
      <div className="auth-card animate-slide-up">
        <div className="auth-brand-wrap">
          <img
            src="/assets/branding/celebrai-logo.png"
            alt="CelebrAI — Plan Smarter. Celebrate Better."
            className="auth-brand-logo"
          />
        </div>

        {mode !== 'reset' && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => setMode('signin')}
            >Sign In</button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >Sign Up</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name" type="text" className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Your full name" value={form.name}
                onChange={e => set('name', e.target.value)} autoComplete="name"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Email address" value={form.email}
              onChange={e => set('email', e.target.value)} autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-with-icon">
                <input
                  id="password" type={showPass ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Password" value={form.password}
                  onChange={e => set('password', e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
              {mode === 'signin' && (
                <button type="button" className="forgot-link" onClick={() => setMode('reset')}>
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword" type="password"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm password" value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)} autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          )}

          {mode === 'signup' && (
            <label className="checkbox-label">
              <input type="checkbox" checked={form.terms} onChange={e => set('terms', e.target.checked)} />
              <span>I agree to the <Link to="/privacy" className="auth-link">Terms & Privacy Policy</Link></span>
              {errors.terms && <span className="form-error">{errors.terms}</span>}
            </label>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : mode === 'signin' ? <>Sign In <ArrowRight size={16} /></> : mode === 'signup' ? <>Create Account <ArrowRight size={16} /></> : 'Send Reset Link'}
          </button>

          {mode === 'reset' && (
            <button type="button" className="btn btn-ghost w-full" onClick={() => setMode('signin')}>
              ← Back to Sign In
            </button>
          )}
        </form>

        {mode !== 'reset' && (
          <>
            <div className="divider-text">or continue with</div>
            <div className="social-buttons">
              <button
                type="button"
                className="btn btn-secondary social-btn"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button type="button" className="btn btn-secondary social-btn" disabled>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.2.78 3.02.82.92-.17 1.8-.91 3.07-.97 1.55-.09 2.72.6 3.46 1.58-3.14 1.8-2.4 5.78.47 6.94-.58 1.52-1.32 3.02-2.02 4.51zm-3.19-17.5c.07 2.38-2.02 4.33-4.12 4.12C9.47 4.46 11.4 2 13.86 2.78z"/>
                </svg>
                Apple
              </button>
            </div>

            {popupBlocked && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ textDecoration: 'underline', color: 'var(--text-secondary)' }}
                  onClick={handleGoogleRedirect}
                  disabled={loading}
                >
                  Popup blocked? Click here to sign in with page redirect
                </button>
              </div>
            )}

            <p className="auth-footer-text">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button className="auth-link-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}
      </div>

      {/* Leaf decorations */}
      <div className="auth-leaves">
        <svg width="80" height="120" viewBox="0 0 80 120" fill="none" opacity="0.15">
          <path d="M40 120C40 120 10 90 5 60C0 30 20 10 40 0C60 10 80 30 75 60C70 90 40 120 40 120Z" fill="#272E2E"/>
        </svg>
      </div>
    </div>
  );
}
