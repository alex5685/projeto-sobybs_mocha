/**
 * ⚠ ANYTHING PLATFORM — DO NOT REWRITE THIS FILE ⚠
 *
 * Shipped v2 auth scaffolding. Same contract as signup/page.tsx: <form
 * onSubmit>, e.preventDefault(), and window.location.href redirect are all
 * load-bearing for the mobile WebView. DO NOT replace <form onSubmit> with
 * <button onClick> — that broke signin platform-wide in a prior AI rewrite.
 *
 *   Safe:   restyle, rewrite copy, add form fields.
 *   Unsafe: replacing <form>, removing preventDefault, bypassing
 *           authClient.signIn.email, changing the callbackUrl redirect.
 */
'use client';

import { useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useState } from 'react';
import { SocialSignInButtons } from '@/components/SocialSignInButtons';

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/do-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg = (data.message as string) || (data.error as string) || `Erro ${res.status}`;
        setError(msg);
        setLoading(false);
        return;
      }

      window.location.href = callbackUrl;
    } catch (err) {
      console.error('[signin] erro:', err);
      setError('Falha de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-[16px]">
      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-[12px] bg-white p-[24px] shadow"
      >
        <h1 className="text-[24px] font-semibold">Entrar</h1>

        <label className="flex flex-col gap-[4px] text-[14px]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[8px] border border-gray-300 p-[10px] text-[16px] outline-none focus:border-blue-500"
          />
        </label>

        <label className="flex flex-col gap-[4px] text-[14px]">
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[8px] border border-gray-300 p-[10px] text-[16px] outline-none focus:border-blue-500"
          />
        </label>

        <a
          href="/account/forgot-password"
          className="text-right text-[14px] text-blue-600 hover:underline -mt-2"
        >
          Esqueceu a senha?
        </a>

        {error && (
          <div className="rounded-[8px] bg-red-50 p-[10px] text-[14px] text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-[8px] bg-blue-600 p-[12px] text-[16px] font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <SocialSignInButtons callbackUrl={callbackUrl} />

        <a
          href={`/account/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-center text-[14px] text-blue-600 hover:underline"
        >
          Não tem conta? Cadastre-se
        </a>
      </form>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
