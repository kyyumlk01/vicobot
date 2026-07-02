'use client';

import { useTheme } from './ThemeContext';

export default function StartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/logo-amber-for-dark-theme.png' : '/logo-charcoal-for-light-theme.png';

  if (!open) return null;

  return (
    <div
      className="overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="start-modal">
        <button className="close" onClick={onClose}>✕</button>
        <img src={logoSrc} alt="Vicobot" style={{ height: 30 }} />
        <h3>Start scanning your niche</h3>
        <p className="sub2">Free forever. No credit card needed.</p>
        <input className="start-input" type="email" placeholder="you@example.com" />
        <button className="btn-grad full-w">Continue →</button>
        <div className="divider">or</div>
        <button className="btn-ghost full-w">Continue with Google</button>
        <p className="foot-note">By continuing you agree to Vicobot&apos;s Terms & Privacy Policy.</p>
      </div>
    </div>
  );
}