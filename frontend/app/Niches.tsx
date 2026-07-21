'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const features = [
  {
    icon: '📊',
    title: 'Real YouTube Demand Score',
    desc: 'Not AI guesses — we fetch actual YouTube data. Every topic gets a 0–100 score based on real view counts from top videos on that topic right now.',
    tag: 'Free',
    tagColor: 'var(--teal)',
    highlight: '87/100',
    highlightLabel: 'Demand Score',
  },
  {
    icon: '👁️',
    title: 'View Prediction',
    desc: 'See the realistic view range you can expect in your first 30 days — calculated from median views of top-performing videos on your topic.',
    tag: 'Free',
    tagColor: 'var(--teal)',
    highlight: '45K–120K',
    highlightLabel: 'Expected Views',
  },
  {
    icon: '🔥',
    title: 'Trending Now',
    desc: 'See what\'s blowing up on YouTube India right now — updated every hour. No need to scroll YouTube for hours. Just pick and film.',
    tag: 'Free',
    tagColor: 'var(--teal)',
    highlight: 'Live',
    highlightLabel: 'Real-time data',
  },
  {
    icon: '💡',
    title: 'Content Gap Finder',
    desc: 'Know exactly what angle nobody has covered yet. We analyze top videos and show you the gaps — so you film something that stands out.',
    tag: 'Free',
    tagColor: 'var(--teal)',
    highlight: '3 Gaps',
    highlightLabel: 'Found per topic',
  },
  {
    icon: '✍️',
    title: 'Title Ideas That Actually Work',
    desc: '5 click-worthy titles generated for every topic — based on what\'s working in your niche right now, not generic templates.',
    tag: 'Free',
    tagColor: 'var(--teal)',
    highlight: '5 Titles',
    highlightLabel: 'Per search',
  },
  {
    icon: '⏰',
    title: 'Best Upload Time',
    desc: 'Stop guessing when to post. Get the exact day and time window when your category gets the most views — tailored to your niche.',
    tag: 'Free',
    tagColor: 'var(--teal)',
    highlight: 'Sat 6–8PM',
    highlightLabel: 'Best time',
  },
  {
    icon: '📝',
    title: 'Video Blueprint',
    desc: 'Get a complete video structure — hook, intro, sections with timing, and a CTA — all tailored to your specific topic. Film smarter, not longer.',
    tag: 'Pro',
    tagColor: 'var(--amber)',
    highlight: '5 Sections',
    highlightLabel: 'Full structure',
  },
  {
    icon: '🖼️',
    title: 'Thumbnail Concepts',
    desc: '3 thumbnail concepts with main text, color scheme, visual description, and the emotion it should trigger — ready to hand to a designer or build yourself.',
    tag: 'Pro',
    tagColor: 'var(--amber)',
    highlight: '3 Concepts',
    highlightLabel: 'Per topic',
  },
  {
    icon: '🏷️',
    title: 'SEO Tags + Description',
    desc: '15 SEO tags, a full description template with timestamps, and a pinned comment — everything you need to upload, ready to copy-paste.',
    tag: 'Pro',
    tagColor: 'var(--amber)',
    highlight: '15 Tags',
    highlightLabel: 'Auto-generated',
  },
];

const stats = [
  { number: '23+', label: 'Niches covered' },
  { number: '100%', label: 'Real YouTube data' },
  { number: '2x', label: 'Faster content planning' },
  { number: '₹49', label: 'Full access/month' },
];

export default function Features() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));

    const statsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) statsObserver.observe(statsRef.current);

    return () => { observer.disconnect(); statsObserver.disconnect(); };
  }, []);

  return (
    <>
      {/* Stats bar */}
      <div
        ref={statsRef}
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          opacity: statsVisible ? 1 : 0,
          transform: statsVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(26px, 3vw, 36px)',
              background: 'linear-gradient(135deg, #FF8A4C, #FF4F8B, #7C5CFF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 6,
            }}>
              {s.number}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features section */}
      <div id="features" style={{ padding: '80px 32px' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="eyebrow-pill" style={{ justifyContent: 'center', display: 'inline-flex' }}>
              <span className="dot" />Everything you need, nothing you don&apos;t
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(26px, 3.2vw, 38px)', letterSpacing: '-0.02em',
              marginBottom: 14,
            }}>
              Stop guessing. Start filming <span className="grad-text">winners.</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
              Every feature is built around one goal — helping you know what to film before you waste time filming the wrong thing.
            </p>
          </div>

          {/* Feature grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 18,
          }}>
            {features.map((f, i) => (
              <div
                key={i}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="feature-card-anim"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${f.tag === 'Pro' ? 'rgba(255,182,72,0.2)' : 'var(--border)'}`,
                  borderRadius: 16,
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  opacity: 0,
                  transform: 'translateY(30px)',
                  transition: `opacity 0.6s ease ${i * 0.07}s, transform 0.6s ease ${i * 0.07}s`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{f.icon}</span>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>
                      {f.title}
                    </p>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    color: f.tagColor,
                    background: f.tag === 'Pro' ? 'rgba(255,182,72,0.12)' : 'rgba(45,212,191,0.12)',
                    padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {f.tag}
                  </span>
                </div>

                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto',
                  paddingTop: 12, borderTop: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
                    color: f.tag === 'Pro' ? 'var(--amber)' : 'var(--teal)',
                  }}>
                    {f.highlight}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {f.highlightLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .feature-card-anim.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        @media (max-width: 600px) {
          .feature-card-anim {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </>
  );
}