'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = ['Tech', 'Fitness', 'Gaming', 'Finance', 'Travel', 'Food', 'Education', 'Entertainment'];
const TRENDING_CATS = ['All', 'Tech', 'Gaming', 'Entertainment', 'Education'];

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

interface SavedTopic {
  id: string;
  topic: string;
  score: number;
  category: string;
  created_at: string;
}

interface TrendingVideo {
  videoId: string;
  title: string;
  channel: string;
  views: number;
  thumbnail: string;
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
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicSaved, setTopicSaved] = useState(false);
  const [variationCount, setVariationCount] = useState(0);
  const [creatorLevel, setCreatorLevel] = useState<string>('new');
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);
  const [trendingCategory, setTrendingCategory] = useState('All');
  const [loadingTrending, setLoadingTrending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get('topic');
      const categoryParam = params.get('category');
      if (topicParam) setTopic(topicParam);
      if (categoryParam) setCategory(categoryParam);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('creator_level')
        .eq('id', user.id)
        .single();
      if (profile) setCreatorLevel(profile.creator_level);

      await fetchSavedTopics();
      await fetchTrending('All');
      setLoading(false);
    }
    checkAuth();
  }, []);

  async function fetchSavedTopics() {
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

  async function fetchTrending(cat: string) {
    setLoadingTrending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`http://localhost:5000/api/trending?category=${cat}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (response.ok) setTrendingVideos(data.videos);
    } catch (err) {
      console.error('Failed to fetch trending');
    } finally {
      setLoadingTrending(false);
    }
  }

  async function runSearch(bypassCache = false, variation = 0) {
    if (!topic.trim() || topic.trim().length < 3) {
      setError('Please enter a topic with at least 3 characters');
      return;
    }
    setError('');
    setSearching(true);
    setResult(null);
    setTopicSaved(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ topic: topic.trim(), category, language, tryAnother: bypassCache, variation }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed');
      setResult(data.result);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Something went wrong. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function handleSearch() {
    setVariationCount(0);
    runSearch(false, 0);
  }

  function handleTryAnother() {
    const next = variationCount + 1;
    setVariationCount(next);
    runSearch(true, next);
  }

  async function handleSaveTopic() {
    if (!result) return;
    setSavingTopic(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('http://localhost:5000/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ topic: topic.trim(), score: result.demandScore, category }),
      });

      const data = await response.json();
      if (response.ok) {
        setTopicSaved(true);
        await fetchSavedTopics();
      }
      if (data.alreadySaved) setTopicSaved(true);
    } catch (err) {
      console.error('Failed to save topic');
    } finally {
      setSavingTopic(false);
    }
  }

  async function handleDeleteSaved(id: string) {
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

  function useTrendingTopic(title: string) {
    const clean = title.replace(/[^\w\s]/gi, '').trim();
    setTopic(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 24 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Vicobot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/saved" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              📌 Saved {savedTopics.length > 0 && `(${savedTopics.length})`}
            </Link>
            <button
              className="btn-ghost"
              style={{ fontSize: 13 }}
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Creator tip */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>
            {creatorLevel === 'new' ? '🌱' : creatorLevel === 'growing' ? '📈' : '🚀'}
          </span>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {creatorLevel === 'new'
              ? 'Tip: Start with Easy competition topics to build momentum before chasing harder niches.'
              : creatorLevel === 'growing'
              ? 'Tip: Medium competition topics with 75+ demand score are your best bet for faster growth right now.'
              : 'Tip: Your channel has authority — go for high-demand topics regardless of competition level.'}
          </p>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: savedTopics.length > 0 ? '1fr 260px' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* Left column */}
          <div>

            {/* Trending Now */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF4F8B', display: 'inline-block' }}></span>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Trending Now</p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>India · YouTube</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TRENDING_CATS.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setTrendingCategory(cat); fetchTrending(cat); }}
                      style={{
                        fontSize: 11, padding: '4px 11px', borderRadius: 20, cursor: 'pointer',
                        border: `1px solid ${trendingCategory === cat ? 'var(--amber)' : 'var(--border)'}`,
                        background: trendingCategory === cat ? 'rgba(255,182,72,0.14)' : 'var(--surface-2)',
                        color: trendingCategory === cat ? 'var(--amber)' : 'var(--text-muted)',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {loadingTrending ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '16px 0' }}>
                  Fetching trending videos...
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {trendingVideos.map((video, i) => (
                    <div
                      key={video.videoId}
                      onClick={() => useTrendingTopic(video.title)}
                      style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', minWidth: 18, textAlign: 'center' }}>
                        {i + 1}
                      </span>
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt={video.title} style={{ width: 60, height: 34, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {video.title}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {video.channel} · {(video.views / 1000).toFixed(0)}K views
                        </p>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>Use →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search box */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px', marginBottom: 20 }}>
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
              {error && <p style={{ marginTop: 12, fontSize: 13, color: '#FF4F8B' }}>{error}</p>}
            </div>

            {/* Loading */}
            {searching && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>Scanning YouTube data...</p>
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
                <div style={{ background: 'rgba(255,182,72,0.1)', border: '1px solid rgba(255,182,72,0.3)', borderRadius: 10, padding: '14px', marginBottom: 18 }}>
                  <p style={{ fontSize: 11, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>✨ AI Verdict</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>{result.verdict}</p>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <button
                    className="btn-ghost"
                    onClick={handleTryAnother}
                    disabled={searching}
                    style={{ fontSize: 13, padding: '9px 16px' }}
                  >
                    🔁 Try Another
                  </button>
                  <button
                    className={topicSaved ? 'btn-ghost' : 'btn-grad'}
                    onClick={handleSaveTopic}
                    disabled={savingTopic || topicSaved}
                    style={{ fontSize: 13, padding: '9px 16px', opacity: savingTopic ? 0.7 : 1 }}
                  >
                    {topicSaved ? '✓ Saved' : savingTopic ? 'Saving...' : '📌 Save Topic'}
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Right — saved sidebar */}
          {savedTopics.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px', position: 'sticky', top: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>📌 Saved Topics</p>
                <Link href="/saved" style={{ fontSize: 12, color: 'var(--teal)' }}>View all</Link>
              </div>
              {savedTopics.slice(0, 8).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8 }}>
                  <span
                    style={{ cursor: 'pointer', flex: 1, color: 'var(--text)' }}
                    onClick={() => { setTopic(t.topic); setCategory(t.category); }}
                  >
                    {t.topic}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)' }}>{t.score}</span>
                    <button
                      onClick={() => handleDeleteSaved(t.id)}
                      style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 4px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {savedTopics.length > 8 && (
                <Link href="/saved" style={{ display: 'block', marginTop: 10, fontSize: 12, color: 'var(--teal)', textAlign: 'center' }}>
                  +{savedTopics.length - 8} more →
                </Link>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}