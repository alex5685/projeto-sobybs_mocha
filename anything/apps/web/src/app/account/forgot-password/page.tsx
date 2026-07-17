'use client';

import { useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar e-mail de recuperação');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('[forgot-password] erro:', err);
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-[16px]">
        <div className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-[12px] bg-white p-[24px] shadow">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-[24px] font-semibold mb-2">E-mail Enviado!</h1>
            <p className="text-[14px] text-gray-600 mb-6">
              Se existe uma conta com o e-mail <strong>{email}</strong>, você receberá um link para
              redefinir sua senha.
            </p>
            <button
              onClick={() => router.push('/account/signin')}
              className="w-full rounded-[8px] bg-blue-600 p-[12px] text-[16px] font-medium text-white hover:bg-blue-700"
            >
              Voltar para Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-[16px]">
      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-[12px] bg-white p-[24px] shadow"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[14px] text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="text-[24px] font-semibold">Esqueci minha senha</h1>
        <p className="text-[14px] text-gray-600">
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        <label className="flex flex-col gap-[4px] text-[14px]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[8px] border border-gray-300 p-[10px] text-[16px] outline-none focus:border-blue-500"
            placeholder="seu@email.com"
          />
        </label>

        {error && (
          <div className="rounded-[8px] bg-red-50 p-[10px] text-[14px] text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-[8px] bg-blue-600 p-[12px] text-[16px] font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar Link de Recuperação'}
        </button>

        <a href="/account/signin" className="text-center text-[14px] text-blue-600 hover:underline">
          Lembrou a senha? Entrar
        </a>
      </form>
    </main>
  );
}
