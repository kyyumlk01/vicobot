'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

export default function UpgradePage() {
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState('free');
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/subscription`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) setSubStatus(data.status);
      setLoading(false);
    }
    init();

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
  }, []);

  async function handleUpgrade() {
    setError('');
    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const res = await fetch('${API_URL}/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subscription');

      const { subscriptionId, keyId } = data;

      const { data: { user } } = await supabase.auth.getUser();

      const rzp = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Vicobot',
        description: 'Vicobot Pro — ₹49/month',
        image: '/logo-amber-for-dark-theme.png',
        prefill: {
          email: user?.email || '',
        },
        theme: { color: '#FF8A4C' },
        handler: async () => {
          setSubStatus('active');
          setProcessing(false);
          router.push('/dashboard');
        },
      });

      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setProcessing(false);
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setProcessing(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('${API_URL}/api/subscription/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) setSubStatus('cancelled');
    } catch (err) {
      setError('Failed to cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '28px 0 64px' }}>
      <div className="wrap" style={{ maxWidth: 560 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-amber-for-dark-theme.png" alt="Vicobot" style={{ height: 24 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Vicobot</span>
          </div>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Dashboard</Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px,3vw,32px)', marginBottom: 10 }}>
            {subStatus === 'active' ? 'Your Subscription' : 'Upgrade to Pro'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            {subStatus === 'active'
              ? 'You are on the Pro plan.'
              : 'Unlock all features for just ₹49/month.'}
          </p>
        </div>

        {/* Plan card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, marginBottom: 20 }}>

          {/* Price */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, background: 'linear-gradient(135deg,#FF8A4C,#FF4F8B,#7C5CFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₹49
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>/month</span>
          </div>

          {/* Features */}
          {[
            '✓ Unlimited topic searches',
            '✓ Real YouTube data analysis',
            '✓ Video Blueprint generator',
            '✓ Thumbnail concept ideas',
            '✓ SEO Tags auto-generated',
            '✓ Topic enhancement suggestions',
            '✓ Shareable result cards',
            '✓ Trending Now — all categories',
            '✓ Saved Topics & History',
          ].map((f, i) => (
            <div key={i} style={{ fontSize: 14, padding: '9px 0', borderBottom: i < 8 ? '1px solid var(--border)' : 'none', color: 'var(--text)' }}>
              {f}
            </div>
          ))}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(255,79,139,0.1)', border: '1px solid rgba(255,79,139,0.3)', borderRadius: 8, fontSize: 13, color: '#FF4F8B' }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: 24 }}>
            {subStatus === 'active' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 9, background: 'rgba(45,212,191,0.1)', border: '1px solid var(--teal)', color: 'var(--teal)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                  ✓ Pro plan active
                </div>
                <br />
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.7 : 1 }}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                </button>
              </div>
            ) : (
              <button
                className="btn-grad"
                onClick={handleUpgrade}
                disabled={processing}
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, opacity: processing ? 0.7 : 1 }}
              >
                {processing ? 'Opening payment...' : 'Subscribe for ₹49/month →'}
              </button>
            )}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Cancel anytime · Secured by Razorpay · No hidden charges
        </p>

      </div>
    </div>
  );
}