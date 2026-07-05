'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SharedResult {
  id: string;
  topic: string;
  score: number;
  category: string;
  competition_level: string;
  expected_views_min: number;
  expected_views_max: number;
  verdict: string;
  created_at: string;
}

export default function SharePage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<SharedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`http://localhost:5000/api/share/${params.id}`);
        if (!response.ok) {
          setNotFound(true);
          return;
        }
        const data = await response.json();
        setResult(data.result);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

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

  if (notFound || !result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 32 }}>🔍</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>Result not found</p>
        <Link href="/" className="btn-grad" style={{ fontSize: 14, padding: '10px 20px' }}>Go to Vicobot</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        {/* Card */}
        <div
          id="share-card"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'var(--accent2)', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'var(--accent3)', filter: 'blur(80px)', opacity: 0.12, pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 20 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Vicobot</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>vicobot.in</span>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Demand Score
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 72, color: scoreColor(result.score), lineHeight: 1 }}>
              {result.score}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>/100</p>
          </div>

          {/* Topic */}
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, textAlign: 'center', marginBottom: 22, lineHeight: 1.4 }}>
            &quot;{result.topic}&quot;
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 22 }}>
            {[
              { label: 'Category', value: result.category },
              { label: 'Competition', value: result.competition_level },
              { label: 'Est. Views', value: `${(result.expected_views_min / 1000).toFixed(0)}K–${(result.expected_views_max / 1000).toFixed(0)}K` },
            ].map(box => (
              <div key={box.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{box.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{box.value}</p>
              </div>
            ))}
          </div>

          {/* Verdict */}
          {result.verdict && (
            <div style={{ background: 'rgba(255,182,72,0.1)', border: '1px solid rgba(255,182,72,0.3)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>{result.verdict}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
            Find your next winning YouTube topic
          </p>
          <Link href="/auth" className="btn-grad" style={{ fontSize: 15, padding: '12px 24px' }}>
            Try Vicobot free →
          </Link>
        </div>

      </div>
    </div>
  );
}