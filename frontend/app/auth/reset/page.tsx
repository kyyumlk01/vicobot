'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleReset() {
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="start-modal" style={{ width: 380, position: 'relative' }}>
        <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 28, marginBottom: 16 }} />

        {sent ? (
          <>
            <h3>Check your email</h3>
            <p className="sub2">
              We sent a password reset link to <b style={{ color: 'var(--text)' }}>{email}</b>.
              Check your inbox and click the link.
            </p>
            <Link href="/auth" className="btn-grad full-w" style={{ marginTop: 20, justifyContent: 'center', display: 'flex' }}>
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h3>Reset your password</h3>
            <p className="sub2">Enter your email and we will send you a reset link.</p>

            {error && (
              <div style={{ background: 'rgba(255,79,139,0.12)', border: '1px solid rgba(255,79,139,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF4F8B', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <input
              className="start-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            />

            <button
              className="btn-grad full-w"
              onClick={handleReset}
              disabled={loading}
              style={{ marginTop: 14, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending...' : 'Send reset link →'}
            </button>

            <Link href="/auth" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
              ← Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}