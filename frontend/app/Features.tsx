'use client';

import { useState } from 'react';

export default function Features() {
  const [tab, setTab] = useState<'free' | 'pro'>('free');
  const [fading, setFading] = useState(false);

  function switchTab(next: 'free' | 'pro') {
    if (next === tab) return;
    setFading(true);
    setTimeout(() => {
      setTab(next);
      setFading(false);
    }, 150);
  }

  return (
    <div className="features" id="features">
      <div className="section-head" style={{ padding: 0 }}>
        <div className="eyebrow-pill" style={{ justifyContent: 'center' }}>
          <span className="dot"></span>Simple pricing
        </div>
        <h2>Free to start. Pro when you&apos;re ready.</h2>
      </div>

      <div className="tab-switch">
        <button className={`tab-btn ${tab === 'free' ? 'active' : ''}`} onClick={() => switchTab('free')}>Free</button>
        <button className={`tab-btn ${tab === 'pro' ? 'active' : ''}`} onClick={() => switchTab('pro')}>Pro</button>
      </div>

      <div className={`feature-panel ${fading ? 'fading' : ''}`}>
        {tab === 'free' ? (
          <>
            <ul className="feature-list">
              <li>🔥 <span><b>Trending Now</b> — real YouTube data, no typing needed</span></li>
              <li>📊 <span><b>Demand Score & View Prediction</b> for any topic</span></li>
              <li>🎯 <span><b>Title Ideas & Content Gaps</b> for every search</span></li>
              <li>⏰ <span><b>Best Upload Time</b> for your niche</span></li>
              <li>📌 <span><b>Saved Topics & History</b></span></li>
            </ul>
            <div className="preview-box">
              <div className="pt">Live preview — &quot;AI tools for beginners&quot;</div>
              <div className="mini-score-row">
                <div className="mini-score"><div className="l">Demand</div><div className="v grad-text">87</div></div>
                <div className="mini-score"><div className="l">Views</div><div className="v">45K–120K</div></div>
                <div className="mini-score"><div className="l">Comp.</div><div className="v" style={{ color: 'var(--teal)' }}>Medium</div></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <ul className="feature-list">
              <li>📝 <span><b>Video Blueprint</b> — hook, script structure, title</span></li>
              <li>🖼️ <span><b>Thumbnail Concepts</b> — text & layout ideas</span></li>
              <li>📈 <span><b>Channel Analysis</b> — paste your channel link</span></li>
              <li>🏷️ <span><b>SEO Tags</b> auto-generated per video</span></li>
              <li>📬 <span><b>Weekly Trend Digest</b> in your inbox</span></li>
            </ul>
            <div className="preview-box">
              <div className="pt">Blueprint preview</div>
              <div className="blueprint-line">Hook: &quot;I tested 10 AI tools so you don&apos;t have to...&quot;</div>
              <div className="blueprint-line">Structure: Problem → 3 tools → results → CTA</div>
              <div className="blueprint-line">Title: &quot;5 AI Tools Beginners Actually Need&quot;</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}