'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SavedTopic {
  id: string;
  topic: string;
  score: number;
  category: string;
  created_at: string;
}

export default function SavedPage() {
  const [loading, setLoading] = useState(true);
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      await fetchSaved();
      setLoading(false);
    }
    load();
  }, []);

  async function fetchSaved() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('http://localhost:5000/api/saved', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (response.ok) setSavedTopics(data.topics);
    } catch (err) {
      console.error('Failed to fetch saved topics');
    }
  }

  async function handleDelete(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`http://localhost:5000/api/saved/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      setSavedTopics(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete topic');
    }
  }

  function scoreColor(score: number) {
    if (score >= 80) return 'var(--amber)';
    if (score >= 60) return 'var(--teal)';
    return 'var(--text-muted)';
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '28px 0 64px' }}>
      <div className="wrap">

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 24 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Vicobot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Dashboard</Link>
            <button
              className="btn-ghost"
              style={{ fontSize: 13 }}
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 3vw, 32px)', marginBottom: 8 }}>
            📌 Saved Topics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {savedTopics.length === 0
              ? 'No saved topics yet — analyze a topic and save it from the dashboard.'
              : `${savedTopics.length} topic${savedTopics.length > 1 ? 's' : ''} saved`}
          </p>
        </div>

        {/* Empty state */}
        {savedTopics.length === 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 14 }}>📭</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Nothing saved yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Analyze a topic and click "Save Topic" to see it here.</p>
            <Link href="/dashboard" className="btn-grad" style={{ fontSize: 14, padding: '10px 20px' }}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Grid */}
        {savedTopics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {savedTopics.map(t => (
              <div
                key={t.id}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {/* Topic name */}
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>
                  {t.topic}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: scoreColor(t.score), background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6 }}>
                    {t.score}/100
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6 }}>
                    {t.category}
                  </span>
                </div>

                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Link
                    href={`/dashboard?topic=${encodeURIComponent(t.topic)}&category=${encodeURIComponent(t.category)}`}
                    className="btn-grad"
                    style={{ fontSize: 12, padding: '7px 14px', flex: 1, textAlign: 'center' }}
                  >
                    Analyze again
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '7px 12px', color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}