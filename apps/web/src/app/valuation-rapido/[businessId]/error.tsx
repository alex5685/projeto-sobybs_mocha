'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ValuationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Valuation page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-red-200 shadow-lg rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo deu errado</h2>
        <p className="text-slate-600 mb-6 text-sm">
          Houve um problema ao carregar o valuation. Tente novamente.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
