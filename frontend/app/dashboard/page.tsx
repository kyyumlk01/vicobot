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

interface Blueprint {
  hook: string;
  structure: Array<{ section: string; duration: string; description: string }>;
  cta: string;
  recommendedLength: string;
  toneStyle: string;
}

interface ThumbnailConcept {
  style: string;
  mainText: string;
  subText: string;
  visualDescription: string;
  colorScheme: string;
  emotion: string;
}

interface ThumbnailResult {
  concepts: ThumbnailConcept[];
  generalTips: string[];
}

interface SeoResult {
  tags: string[];
  descriptionTemplate: string;
  pinnedComment: string;
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
  const [activeProTab, setActiveProTab] = useState<'blueprint' | 'thumbnail' | 'seo' | null>(null);
const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
const [thumbnailResult, setThumbnailResult] = useState<ThumbnailResult | null>(null);
const [seoResult, setSeoResult] = useState<SeoResult | null>(null);
const [loadingPro, setLoadingPro] = useState(false);
const [copiedTag, setCopiedTag] = useState<number | null>(null);
const [copiedDesc, setCopiedDesc] = useState(false);
const [copiedComment, setCopiedComment] = useState(false);
const [shareId, setShareId] = useState<string | null>(null);
const [sharing, setSharing] = useState(false);
const [shareModalOpen, setShareModalOpen] = useState(false);
const [copiedShareLink, setCopiedShareLink] = useState(false);
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
async function fetchProFeature(type: 'blueprint' | 'thumbnail' | 'seo') {
  if (!result) return;
  setActiveProTab(type);
  setLoadingPro(true);
  setBlueprint(null);
  setThumbnailResult(null);
  setSeoResult(null);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(`http://localhost:5000/api/pro/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ topic: topic.trim(), category, language }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed');

    if (type === 'blueprint') setBlueprint(data.blueprint);
    if (type === 'thumbnail') setThumbnailResult(data.thumbnail);
    if (type === 'seo') setSeoResult(data.seo);
  } catch (err) {
    console.error(`Failed to fetch ${type}`);
  } finally {
    setLoadingPro(false);
  }
}

function copyText(text: string, setter: (v: boolean) => void) {
  navigator.clipboard?.writeText(text);
  setter(true);
  setTimeout(() => setter(false), 1500);
}


async function handleShare() {
  if (!result) return;
  setSharing(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('http://localhost:5000/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        topic: topic.trim(),
        score: result.demandScore,
        category,
        competitionLevel: result.competitionLevel,
        expectedViewsMin: result.expectedViewsMin,
        expectedViewsMax: result.expectedViewsMax,
        verdict: result.verdict,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setShareId(data.shareId);
      setShareModalOpen(true);
    }
  } catch (err) {
    console.error('Failed to create share');
  } finally {
    setSharing(false);
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

                  <button
  className="btn-ghost"
  onClick={handleShare}
  disabled={sharing}
  style={{ fontSize: 13, padding: '9px 16px', opacity: sharing ? 0.7 : 1 }}
>
  {sharing ? 'Creating...' : '📤 Share'}
</button>
                </div>

                {/* Pro Tools */}
<div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
      ✦ Pro Tools
    </span>
    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>free during beta</span>
  </div>

  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
    {[
      { key: 'blueprint', label: '📝 Video Blueprint' },
      { key: 'thumbnail', label: '🖼️ Thumbnail Ideas' },
      { key: 'seo', label: '🏷️ SEO Tags' },
    ].map(tab => (
      <button
        key={tab.key}
        onClick={() => fetchProFeature(tab.key as 'blueprint' | 'thumbnail' | 'seo')}
        disabled={loadingPro}
        style={{
          fontSize: 13, padding: '9px 16px', borderRadius: 9, cursor: 'pointer',
          border: `1px solid ${activeProTab === tab.key ? 'var(--accent3)' : 'var(--border)'}`,
          background: activeProTab === tab.key ? 'rgba(124,92,255,0.12)' : 'var(--surface-2)',
          color: activeProTab === tab.key ? 'var(--accent3)' : 'var(--text-muted)',
          opacity: loadingPro ? 0.7 : 1,
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>

  {/* Loading */}
  {loadingPro && (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
        Generating {activeProTab}...
      </p>
    </div>
  )}

  {/* Blueprint result */}
  {!loadingPro && blueprint && activeProTab === 'blueprint' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '16px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Hook</p>
        <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text)' }}>&quot;{blueprint.hook}&quot;</p>
      </div>

      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '16px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Structure · {blueprint.recommendedLength} · {blueprint.toneStyle}
        </p>
        {blueprint.structure.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < blueprint.structure.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 3, borderRadius: 4, background: 'var(--accent3)', flexShrink: 0, minHeight: 40 }} />
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{s.section}</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{s.duration}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '16px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>CTA</p>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>{blueprint.cta}</p>
      </div>
    </div>
  )}

  {/* Thumbnail result */}
  {!loadingPro && thumbnailResult && activeProTab === 'thumbnail' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {thumbnailResult.concepts.map((concept, i) => (
        <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Option {i + 1}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{concept.style}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--teal)' }}>{concept.emotion}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>MAIN TEXT</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--amber)' }}>{concept.mainText}</p>
              {concept.subText && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{concept.subText}</p>}
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>COLORS</p>
              <p style={{ fontSize: 13 }}>{concept.colorScheme}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>VISUAL</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{concept.visualDescription}</p>
            </div>
          </div>
        </div>
      ))}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '14px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>General Tips</p>
        {thumbnailResult.generalTips.map((tip, i) => (
          <p key={i} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '5px 0', borderBottom: i < thumbnailResult.generalTips.length - 1 ? '1px solid var(--border)' : 'none' }}>• {tip}</p>
        ))}
      </div>
    </div>
  )}

  {/* SEO result */}
  {!loadingPro && seoResult && activeProTab === 'seo' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '16px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Tags ({seoResult.tags.length})
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {seoResult.tags.map((tag, i) => (
            <span
              key={i}
              onClick={() => { navigator.clipboard?.writeText(tag); setCopiedTag(i); setTimeout(() => setCopiedTag(null), 1200); }}
              style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: copiedTag === i ? 'rgba(45,212,191,0.15)' : 'var(--surface)', border: `1px solid ${copiedTag === i ? 'var(--teal)' : 'var(--border)'}`, color: copiedTag === i ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description Template</p>
          <button
            onClick={() => copyText(seoResult.descriptionTemplate, setCopiedDesc)}
            style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: copiedDesc ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
          >
            {copiedDesc ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{seoResult.descriptionTemplate}</p>
      </div>

      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pinned Comment</p>
          <button
            onClick={() => copyText(seoResult.pinnedComment, setCopiedComment)}
            style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: copiedComment ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
          >
            {copiedComment ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>{seoResult.pinnedComment}</p>
      </div>
    </div>
  )}

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
      {shareModalOpen && shareId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareModalOpen(false); }}
        >
          <div style={{ width: 380, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, position: 'relative' }}>
            <button
              onClick={() => setShareModalOpen(false)}
              style={{ position: 'absolute', top: 14, right: 16, fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              ✕
            </button>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Share your result</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>Share this topic analysis with other creators.</p>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>DEMAND SCORE</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, color: 'var(--amber)', lineHeight: 1 }}>{result?.demandScore}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>&quot;{topic}&quot;</p>
            </div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                vicobot.in/share/{shareId}
              </p>
              <button
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vicobot.in';
                  navigator.clipboard?.writeText(`${origin}/share/${shareId}`);
                  setCopiedShareLink(true);
                  setTimeout(() => setCopiedShareLink(false), 1500);
                }}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: copiedShareLink ? 'rgba(45,212,191,0.15)' : 'var(--surface)', border: `1px solid ${copiedShareLink ? 'var(--teal)' : 'var(--border)'}`, color: copiedShareLink ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}
              >
                {copiedShareLink ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vicobot.in';
                const text = `Check out this YouTube topic analysis on Vicobot! Score: ${result?.demandScore}/100 for "${topic}" 🔥\n${origin}/share/${shareId}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 9, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' }}
            >
              <span>💬</span> Share on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}