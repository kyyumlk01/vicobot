'use client';

import { useTheme } from './ThemeContext';

export default function Navbar({ onStart }: { onStart: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const logoSrc = theme === 'dark' ? '/logo-amber-for-dark-theme.png' : '/logo-charcoal-for-light-theme.png';

  return (
    <nav>
      <div className="brand">
        <img src={logoSrc} alt="Vicobot" />
        <span>Vicobot</span>
      </div>
      <div className="nav-links">
        <a href="#niches">Discover</a>
        <a href="#how">How it works</a>
        <a href="#features">Pricing</a>
      </div>
      <div className="nav-right">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <button className="btn-grad" onClick={onStart}>Start now</button>
      </div>
    </nav>
  );
}