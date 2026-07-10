import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

type Ctx = { params: Promise<{ id: string; imageId: string }> };

// PATCH /api/business/[id]/images/[imageId] — set as primary
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

  // Unset all primary images for this business, then set the selected one
  await sql`UPDATE business_images SET is_primary = 0 WHERE business_id = ${id}`;
  await sql`UPDATE business_images SET is_primary = 1 WHERE id = ${imageId} AND business_id = ${id}`;

  return Response.json({ success: true });
}

// DELETE /api/business/[id]/images/[imageId] — delete image
export async function DELETE(req: NextRequest, { params }: Ctx) {
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

  await sql`DELETE FROM business_images WHERE id = ${imageId} AND business_id = ${id}`;

  // If deleted image was primary, promote the first remaining image
  const [remaining] = await sql`
    SELECT id FROM business_images WHERE business_id = ${id} ORDER BY display_order ASC, created_at ASC LIMIT 1
  `;
  if (remaining) {
    await sql`UPDATE business_images SET is_primary = 1 WHERE id = ${remaining.id}`;
  }

  return Response.json({ success: true });
}
