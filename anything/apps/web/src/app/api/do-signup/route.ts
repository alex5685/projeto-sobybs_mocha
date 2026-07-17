import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json()) as { email: string; password: string; name?: string };
  const { email, password, name } = body;

  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_CREATE_APP_URL ||
    'http://localhost:4000';

  // Chamar auth.handler diretamente no servidor (comprovado funcionar no debug)
  const authRequest = new Request(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl,
      'X-Forwarded-Host': new URL(baseUrl).host,
    },
    body: JSON.stringify({
      email,
      password,
      name: name || email.split('@')[0] || 'User',
    }),
  });

  // Retornar a resposta do auth.handler diretamente (com cookies incluídos)
  return auth.handler(authRequest);
}
