'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // All browser APIs (localStorage, Date.now, Math.random) are safe here — runs client-only
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    // Lazily get or create a persistent anonymous visitor ID
    let visitorId: string;
    try {
      const key = 'sobybs_visitor_id';
      const existing = localStorage.getItem(key);
      if (existing) {
        visitorId = existing;
      } else {
        visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(key, visitorId);
      }
    } catch {
      visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }

    const referrer = document.referrer || undefined;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, path: pathname, referrer }),
    }).catch(() => {
      // Never break UX for analytics errors
    });
  }, [pathname]);

  return null;
}
