export default function HowItWorks() {
  return (
    <div className="how" id="how">
      <div className="eyebrow-pill" style={{ justifyContent: 'center' }}>
        <span className="dot"></span>From idea to upload
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.2vw,36px)' }}>
        Three steps, no guesswork.
      </h2>
      <div className="steps">
        <div className="step">
          <b>Scan</b>
          <p>Vicobot watches your niche around the clock and surfaces what&apos;s catching fire right now.</p>
        </div>
        <div className="arrow">→</div>
        <div className="step">
          <b>Score</b>
          <p>Every idea gets a view-potential score, based on search demand, competition, and timing.</p>
        </div>
        <div className="arrow">→</div>
        <div className="step">
          <b>Script</b>
          <p>Turn the winning idea into a ready-to-film blueprint, hook, structure, and title included.</p>
        </div>
      </div>
    </div>
  );
}