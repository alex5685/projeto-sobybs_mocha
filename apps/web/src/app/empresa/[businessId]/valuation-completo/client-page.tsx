'use client';

import nextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const ClientView = nextDynamic(() => import('./client-view'), {
  ssr: false,
});

export default function ClientPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#00A9E0]" />
        </div>
      }
    >
      <ClientView />
    </Suspense>
  );
}
