'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      <div className="wrap">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '12px' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Vicobot dashboard — coming soon.
        </p>
        <button
          className="btn-ghost"
          style={{ marginTop: '24px' }}
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/');
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}