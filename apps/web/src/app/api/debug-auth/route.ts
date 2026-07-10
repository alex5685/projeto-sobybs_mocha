import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. DB
  try {
    const rows = await sql`SELECT 1 as ok`;
    results.db = { ok: true };
  } catch (err: unknown) {
    results.db = { ok: false, error: String(err) };
  }

  // 2. Env
  const appUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_CREATE_APP_URL ||
    'http://localhost:4000';
  results.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || '(not set)',
    appUrl,
  };

  // 3. Inspecionar o objeto auth
  try {
    results.authKeys = Object.keys(auth as object);
    results.hasHandler = typeof (auth as Record<string, unknown>).handler === 'function';
  } catch (err) {
    results.authKeys = { error: String(err) };
  }

  // 4. Testar auth.handler diretamente (URL correta desta vez)
  const signupUrl = `${appUrl}/api/auth/sign-up/email`;
  results.signupUrl = signupUrl;

  try {
    const fakeReq = new Request(signupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: appUrl },
      body: JSON.stringify({
        email: `debug-${Date.now()}@test.com`,
        password: 'TestPass123!',
        name: 'Debug',
      }),
    });
    const authAny = auth as unknown as { handler: (r: Request) => Promise<Response> };
    if (typeof authAny.handler === 'function') {
      const res = await authAny.handler(fakeReq);
      const body = await res.text();
      results.handlerTest = { status: res.status, body: body.slice(0, 500) };
    } else {
      results.handlerTest = { error: 'auth.handler nao existe', keys: Object.keys(auth as object) };
    }
  } catch (err) {
    results.handlerTest = { error: String(err) };
  }

  return Response.json(results);
}
