'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Tech', 'Fitness', 'Gaming', 'Finance', 'Travel', 'Food', 'Education', 'Entertainment'];

interface SearchResult {
  demandScore: number;
  expectedViewsMin: number;
  expectedViewsMax: number;
  competitionLevel: string;
  uploadDay: string;
  uploadTime: string;
  analysis: string;
  contentGaps: string[];
  titleIdeas: string[];
  verdict: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Tech');
  const [language, setLanguage] = useState('english');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
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

  async function handleSearch() {
    if (!topic.trim() || topic.trim().length < 3) {
      setError('Please enter a topic with at least 3 characters');
      return;
    }
    setError('');
    setSearching(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ topic: topic.trim(), category, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResult(data.result);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Something went wrong. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function copyTitle(title: string, index: number) {
    navigator.clipboard?.writeText(title);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  }

  function compColor(level: string) {
    if (level === 'Easy') return 'var(--teal)';
    if (level === 'Hard') return '#FF4F8B';
    return 'var(--amber)';
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 24 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Vicobot</span>
          </div>
          <button
            className="btn-ghost"
            style={{ fontSize: 13 }}
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
          >
            Sign out
          </button>
        </div>

        {/* Search box */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter a YouTube topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1, minWidth: 200, padding: '12px 14px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14 }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14 }}
            >
              <option value="english">English</option>
              <option value="hindi">Hindi/Hinglish</option>
            </select>
            <button
              className="btn-grad"
              onClick={handleSearch}
              disabled={searching}
              style={{ opacity: searching ? 0.7 : 1, whiteSpace: 'nowrap' }}
            >
              {searching ? 'Analyzing...' : '✨ Analyze'}
            </button>
          </div>
          {error && (
            <p style={{ marginTop: 12, fontSize: 13, color: '#FF4F8B' }}>{error}</p>
          )}
        </div>

        {/* Loading state */}
        {searching && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
              Scanning YouTube data...
            </p>
          </div>
        )}

        {/* Result */}
        {result && !searching && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '26px' }}>

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Analysis result
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 20 }}>
              &quot;{topic}&quot;
            </h2>

            {/* Score boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Demand', value: `${result.demandScore}/100`, color: result.demandScore >= 75 ? 'var(--amber)' : 'var(--teal)' },
                { label: 'Expected Views', value: `${(result.expectedViewsMin / 1000).toFixed(0)}K–${(result.expectedViewsMax / 1000).toFixed(0)}K` },
                { label: 'Competition', value: result.competitionLevel, color: compColor(result.competitionLevel) },
                { label: 'Best Upload', value: `${result.uploadDay}, ${result.uploadTime}` },
              ].map((box) => (
                <div key={box.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>{box.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: box.color || 'var(--text)' }}>{box.value}</div>
                </div>
              ))}
            </div>

            {/* Analysis */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Analysis</p>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{result.analysis}</p>
            </div>

            {/* Content gaps */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Content Gaps</p>
              {result.contentGaps.map((gap, i) => (
                <div key={i} style={{ fontSize: 13, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>• {gap}</div>
              ))}
            </div>

            {/* Title ideas */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Title Ideas</p>
              {result.titleIdeas.map((title, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span>{i + 1}. {title}</span>
                  <button
                    onClick={() => copyTitle(title, i)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {copied === i ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            {/* Verdict */}
            <div style={{ background: 'rgba(255,182,72,0.1)', border: '1px solid rgba(255,182,72,0.3)', borderRadius: 10, padding: '14px' }}>
              <p style={{ fontSize: 11, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>✨ AI Verdict</p>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{result.verdict}</p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}