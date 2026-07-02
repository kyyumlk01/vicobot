export default function Footer({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div className="trust wrap">
        <p>
          Built by <b style={{ color: 'var(--text)' }}>a solo creator</b> who got tired of guessing what to film next — not a faceless company.
        </p>
      </div>

      <div className="final-cta wrap">
        <h2>Stop guessing.<br /><span className="grad-text">Start filming winners.</span></h2>
        <button className="btn-grad" onClick={onStart}>Find your next video, free →</button>
      </div>

      <footer>
        <p>Vicobot — built by a solo creator, for creators.</p>
      </footer>
    </>
  );
}