'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleUpdate() {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push('/dashboard');
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
        <h3>Set new password</h3>
        <p className="sub2">Choose a strong password for your account.</p>

        {error && (
          <div style={{ background: 'rgba(255,79,139,0.12)', border: '1px solid rgba(255,79,139,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF4F8B', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <input
          className="start-input"
          type="password"
          placeholder="New password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="start-input"
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
          style={{ marginTop: 10 }}
        />

        <button
          className="btn-grad full-w"
          onClick={handleUpdate}
          disabled={loading}
          style={{ marginTop: 14, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Updating...' : 'Update password →'}
        </button>
      </div>
    </div>
  );
}