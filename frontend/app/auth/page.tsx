'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit() {
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
     if (mode === 'signup') {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  if (data?.user && data.user.identities?.length === 0) {
    setError('An account with this email already exists. Please log in instead.');
    setLoading(false);
    return;
  }

  setConfirmEmail(email);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (confirmEmail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="start-modal" style={{ width: 380, position: 'relative', textAlign: 'center' }}>
          <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 28, marginBottom: 20 }} />
          <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
          <h3 style={{ marginBottom: 10 }}>Check your email</h3>
          <p className="sub2">
            We sent a confirmation link to<br />
            <b style={{ color: 'var(--text)' }}>{confirmEmail}</b>
          </p>
          <p className="sub2" style={{ marginTop: 10 }}>
            Click the link in the email to activate your account, then come back to log in.
          </p>
          <button
            className="btn-ghost full-w"
            onClick={() => { setConfirmEmail(''); setMode('login'); }}
            style={{ marginTop: 20 }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="start-modal" style={{ position: 'relative', width: '380px' }}>
        <a href="/" style={{ display: 'block', marginBottom: '16px' }}>
          <img
            src="/logo-amber-for-dark-theme.png"
            alt="Vicobot"
            style={{ height: 28 }}
          />
        </a>
        <h3>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h3>
        <p className="sub2">
          {mode === 'login' ? 'Log in to your Vicobot account' : 'Free forever. No credit card needed.'}
        </p>

        {error && (
          <div style={{ background: 'rgba(255,79,139,0.12)', border: '1px solid rgba(255,79,139,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#FF4F8B', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <input
          className="start-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="start-input"
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ marginTop: '10px' }}
        />

        <button
          className="btn-grad full-w"
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{ marginTop: '16px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in →' : 'Create account →'}
        </button>

        <div className="divider">or</div>

        <button
          className="btn-ghost full-w"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Create a new account' : 'Already have an account? Log in'}
        </button>

        {mode === 'login' && (
          <p className="foot-note" style={{ marginTop: '14px' }}>
            <Link href="/auth/reset" style={{ color: 'var(--teal)' }}>Forgot password?</Link>
          </p>
        )}
      </div>
    </div>
  );
}