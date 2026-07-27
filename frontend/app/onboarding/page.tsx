'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

const levels = [
  {
    key: 'new',
    emoji: '🌱',
    title: 'New Creator',
    desc: 'Just starting out, 0–100 subscribers, figuring out what to film.',
  },
  {
    key: 'growing',
    emoji: '📈',
    title: 'Growing Creator',
    desc: 'Already posting, 100–10K subscribers, want to grow faster.',
  },
  {
    key: 'established',
    emoji: '🚀',
    title: 'Established Creator',
    desc: '10K+ subscribers, serious about scaling views and revenue.',
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_URL}/api/profile/level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ creatorLevel: selected }),
      });

      if (!response.ok) throw new Error('Failed to save');

      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 36, marginBottom: 18 }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 28px)', marginBottom: 10 }}>
            Where are you in your creator journey?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            This helps us personalize your topic recommendations.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {levels.map(level => (
            <button
              key={level.key}
              onClick={() => setSelected(level.key)}
              style={{
                background: selected === level.key ? 'var(--surface-2)' : 'var(--surface)',
                border: `1.5px solid ${selected === level.key ? 'var(--amber)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s ease',
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{level.emoji}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, marginBottom: 4, color: selected === level.key ? 'var(--amber)' : 'var(--text)' }}>
                  {level.title}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {level.desc}
                </p>
              </div>
              {selected === level.key && (
                <span style={{ marginLeft: 'auto', color: 'var(--amber)', fontSize: 18, flexShrink: 0 }}>✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          className="btn-grad"
          onClick={handleContinue}
          disabled={!selected || saving}
          style={{ width: '100%', justifyContent: 'center', opacity: !selected || saving ? 0.6 : 1, fontSize: 15, padding: '13px' }}
        >
          {saving ? 'Saving...' : 'Continue to Dashboard →'}
        </button>

      </div>
    </div>
  );
}