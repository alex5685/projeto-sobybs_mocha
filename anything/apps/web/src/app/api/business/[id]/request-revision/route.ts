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

  const subLevel = sub[0].subscription_level as string;

  // Bronze: apenas 1 revisão a cada 90 dias
  if (subLevel === 'bronze' && valuation[0]) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    if (valuation[0].created_at > ninetyDaysAgo && valuation[0].revisions_count >= 1) {
      return Response.json({ error: 'Plano Bronze: 1 revisão a cada 90 dias' }, { status: 429 });
    }
  }

  // Salva o número de revisões antes de deletar
  const previousRevisions = valuation[0] ? Number(valuation[0].revisions_count ?? 0) : 0;

  // Remove valuation antigo para forçar regeneração com dados atuais
  await sql`DELETE FROM valuations WHERE business_id = ${id} AND type = 'complete'`;

  // Gera novo valuation imediatamente via complete-valuation endpoint
  const baseUrl = process.env.NEXT_PUBLIC_CREATE_APP_URL || process.env.BETTER_AUTH_URL || '';
  const headers = req.headers;

  try {
    const regenRes = await fetch(`${baseUrl}/api/business/${id}/complete-valuation?refresh=1`, {
      method: 'GET',
      headers: {
        cookie: headers.get('cookie') || '',
        authorization: headers.get('authorization') || '',
      },
    });

    if (regenRes.ok) {
      const data = (await regenRes.json()) as { valuation: Record<string, unknown> };
      // Update revisions_count on the freshly created valuation
      await sql`UPDATE valuations SET revisions_count = ${previousRevisions + 1} WHERE business_id = ${id} AND type = 'complete'`;
      return Response.json({ success: true, valuation: data.valuation, regenerated: true });
    }
  } catch (err) {
    console.error('Error regenerating valuation in request-revision:', err);
  }

  // Fallback: just signal the frontend to refresh
  return Response.json({ success: true, regenerated: false });
}
