import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const valuation = await sql`
    SELECT qv.id FROM quick_valuations qv
    JOIN businesses b ON b.id = qv.business_id
    WHERE qv.id = ${id} AND b.owner_id = ${user.id}
  `;
  if (!valuation[0]) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  await sql`UPDATE quick_valuations SET notified_expiration = 1 WHERE id = ${id}`;
  return Response.json({ success: true });
}
