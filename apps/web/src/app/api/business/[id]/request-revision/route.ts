import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const business = await sql`SELECT owner_id FROM businesses WHERE id = ${id}`;
  if (!business[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
  if (business[0].owner_id !== user.id)
    return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const sub =
    await sql`SELECT subscription_level FROM user_profiles WHERE id = ${user.id} AND subscription_level IS NOT NULL AND subscription_level != 'none'`;
  if (!sub[0]) return Response.json({ error: 'Plano ativo necessário' }, { status: 403 });

  const valuation =
    await sql`SELECT id, revisions_count, created_at FROM valuations WHERE business_id = ${id} AND type = 'complete' ORDER BY created_at DESC LIMIT 1`;
  if (!valuation[0]) return Response.json({ error: 'Valuation não encontrado' }, { status: 404 });

  const subLevel = sub[0].subscription_level as string;
  if (subLevel === 'bronze') {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    if (valuation[0].created_at > ninetyDaysAgo && valuation[0].revisions_count >= 1) {
      return Response.json({ error: 'Plano Bronze: 1 revisão a cada 90 dias' }, { status: 429 });
    }
  }

  await sql`UPDATE valuations SET revisions_count = revisions_count + 1, updated_at = NOW() WHERE id = ${valuation[0].id}`;
  return Response.json({ success: true });
}
