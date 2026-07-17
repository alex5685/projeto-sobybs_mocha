import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

type Ctx = { params: Promise<{ id: string; imageId: string }> };

// PATCH /api/business/[id]/images/[imageId]/primary — set as primary
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, imageId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const [business] = await sql`SELECT owner_id FROM businesses WHERE id = ${id}`;
  if (!business) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
  if (business.owner_id !== user.id) {
    const [p] = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (p?.user_type !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 });
  }

  await sql`UPDATE business_images SET is_primary = 0 WHERE business_id = ${id}`;
  await sql`UPDATE business_images SET is_primary = 1 WHERE id = ${imageId} AND business_id = ${id}`;

  return Response.json({ success: true });
}
