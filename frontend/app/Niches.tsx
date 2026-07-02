'use client';

import { useEffect, useRef } from 'react';

const nicheData = [
  { key: 'tech', name: 'Tech', emoji: '💻', demand: 88, dur: '312 topics', desc: "From AI tools to gadget reviews — see what tech content is actually pulling views right now." },
  { key: 'fitness', name: 'Fitness', emoji: '🏋️', demand: 81, dur: '184 topics', desc: "Home workouts, diet hacks, transformations — know which angle has demand before you film." },
  { key: 'gaming', name: 'Gaming', emoji: '🎮', demand: 93, dur: '401 topics', desc: "New releases, walkthroughs, reactions — gaming moves fast, so does this radar." },
  { key: 'finance', name: 'Finance', emoji: '💰', demand: 76, dur: '96 topics', desc: "Side hustles, saving tips, market explainers — fewer creators, less noise, real opportunity." },
  { key: 'travel', name: 'Travel', emoji: '✈️', demand: 79, dur: '142 topics', desc: "Budget trips, hidden spots, vlogs — find the angle your destination hasn't been covered from yet." },
];

export default function Niches() {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      { threshold: 0.25 }
    );
    rowRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="section-head" id="niches">
        <div className="eyebrow-pill"><span className="dot"></span>Built for every niche</div>
        <h2>One radar. Every niche.</h2>
        <p>Real YouTube data, scored for what&apos;s actually working right now.</p>
      </div>
      <div className="niches">
        {nicheData.map((n, i) => (
          <div className="niche-row" key={n.key} ref={(el) => { rowRefs.current[i] = el; }}>
            <div className="thumb">
              <div className="thumb-frame">
                <span className="thumb-emoji">{n.emoji}</span>
                <div className="play-btn"><div className="triangle"></div></div>
                <span className="demand-badge">{n.demand}</span>
                <span className="dur-badge">{n.dur}</span>
              </div>
            </div>
            <div className="niche-text">
              <h3>{n.emoji} {n.name}</h3>
              <p>{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}