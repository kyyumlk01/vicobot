'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Ticker from './Ticker';
import Niches from './Niches';
import HowItWorks from './HowItWorks';
import Features from './Features';
import Footer from './Footer';
import StartModal from './StartModal';

export default function Home() {
  const [startOpen, setStartOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setScrollPct(scrolled || 0);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="progress-bar" style={{ width: `${scrollPct}%` }} />
      <Navbar onStart={() => setStartOpen(true)} />
      <Hero onStart={() => setStartOpen(true)} />
      <Ticker />
      <Niches />
      <HowItWorks />
      <Features />
      <Footer onStart={() => setStartOpen(true)} />
      <StartModal open={startOpen} onClose={() => setStartOpen(false)} />
    </>
  );
}