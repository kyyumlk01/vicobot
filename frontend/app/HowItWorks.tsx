export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: '🎯',
      title: 'Find or pick a topic',
      desc: 'Type any topic, or pick from live trending YouTube India videos — updated every hour so you never run out of ideas.',
    },
    {
      num: '02',
      icon: '📊',
      title: 'Get real data, instantly',
      desc: 'Vicobot fetches actual YouTube videos on your topic and calculates a demand score, view prediction, and competition level — all from real data.',
    },
    {
      num: '03',
      icon: '🎬',
      title: 'Film with confidence',
      desc: 'Use the blueprint, title ideas, thumbnail concepts, and SEO tags to create your video — everything in one place, ready to copy.',
    },
  ];

  return (
    <div id="how" style={{ padding: '80px 32px', background: 'var(--surface-2)' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="eyebrow-pill" style={{ justifyContent: 'center', display: 'inline-flex' }}>
            <span className="dot" />How it works
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(26px,3.2vw,36px)', letterSpacing: '-0.02em', marginBottom: 12,
          }}>
            From idea to ready-to-film in 60 seconds.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 420, margin: '0 auto' }}>
            No complicated setup. No learning curve. Just type a topic and go.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '28px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    {step.num}
                  </span>
                  <span style={{ fontSize: 24 }}>{step.icon}</span>
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17,
                  marginBottom: 10,
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', right: -20, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 20, color: 'var(--border)',
                  display: 'window innerWidth > 768 ? block : none',
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}