'use client';

import { useRef } from 'react';

const miniThumbs = [
  { cls: 'mt1', depth: 3, emoji: '🎮', label: 'Hidden settings', score: 93, tier: 'hi' },
  { cls: 'mt2', depth: 5, emoji: '💻', label: 'AI tools 2026', score: 87, tier: 'hi' },
  { cls: 'mt3', depth: 4, emoji: '🏋️', label: 'Home workouts', score: 74, tier: 'mid' },
  { cls: 'mt4', depth: 6, emoji: '💰', label: 'Side hustles', score: 76, tier: 'mid' },
];

export default function Hero({ onStart }: { onStart: () => void }) {
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    thumbRefs.current.forEach((el, i) => {
      if (!el) return;
      const depth = miniThumbs[i].depth;
      el.style.transform = `translate(${dx * depth * 10}px, ${dy * depth * 10}px)`;
    });
  }

  return (
    <section className="hero wrap">
      <div>
        <div className="eyebrow-pill"><span className="dot"></span>AI Topic Radar for YouTube Creators</div>
        <h1>Know what to film,<br /><span className="grad-text">before you film it.</span></h1>
        <p className="sub">Vicobot scans your niche, scores every idea by view potential, and tells you which one to shoot next. Stop guessing. Start filming winners.</p>
        <div className="cta-row">
          <button className="btn-grad" onClick={onStart}>Start now, it&apos;s free →</button>
          <a href="#how" className="btn-ghost">See how it works</a>
        </div>
      </div>
      <div className="hero-visual" onMouseMove={handleMouseMove}>
        <div className="ambient-icon a1">👍</div>
        <div className="ambient-icon a2">🔔</div>
        <div className="ambient-icon a3">👁️</div>
        <div className="player-frame">
          <div className="scrubber"><div className="scrubber-fill"></div></div>
          <div className="play-btn-big"><div className="triangle-big"></div></div>
          <div className="player-badge">Scanning your niche…</div>
        </div>
        {miniThumbs.map((t, i) => (
          <div
            key={t.cls}
            className={`mini-thumb ${t.cls}`}
            ref={(el) => { thumbRefs.current[i] = el; }}
          >
            <div className="ic">{t.emoji}</div>
            <div className="row">
              <span>{t.label}</span>
              <span className={`sc ${t.tier}`}>{t.score}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}