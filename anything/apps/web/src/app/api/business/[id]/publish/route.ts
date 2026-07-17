import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const business = await sql`SELECT owner_id FROM businesses WHERE id = ${id}`;
  if (!business[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
  if (business[0].owner_id !== user.id)
    return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const body = (await req.json()) as { is_public?: boolean };
  const isPublic = body.is_public ? 1 : 0;
  await sql`UPDATE businesses SET is_public = ${isPublic}, updated_at = NOW() WHERE id = ${id}`;

  return Response.json({ is_public: isPublic });
}
