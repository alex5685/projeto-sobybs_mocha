import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// GET /api/business/[id]/images — list images for a business
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check business exists and is accessible
  const [business] = await sql`SELECT owner_id, is_public FROM businesses WHERE id = ${id}`;
  if (!business) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });

  if (!business.is_public) {
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;
    if (!user) return Response.json({ error: 'Acesso negado' }, { status: 403 });
    if (business.owner_id !== user.id) {
      const [p] = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
      if (p?.user_type !== 'admin')
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
  }

  const images = await sql`
    SELECT id, storage_key, file_name, file_url, is_primary, display_order, created_at
    FROM business_images
    WHERE business_id = ${id}
    ORDER BY display_order ASC, created_at ASC
  `;

  return Response.json({ images });
}

// POST /api/business/[id]/images — save an already-uploaded image URL
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const [business] = await sql`SELECT owner_id FROM businesses WHERE id = ${id}`;
  if (!business) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
  if (business.owner_id !== user.id) {
    const [p] = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (p?.user_type !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // Check image limit
  const [countRow] =
    await sql`SELECT COUNT(*) as cnt FROM business_images WHERE business_id = ${id}`;
  const count = parseInt(String(countRow?.cnt ?? '0'));
  if (count >= 7) {
    return Response.json({ error: 'Limite máximo de 7 fotos atingido' }, { status: 400 });
  }

  // Accept JSON body: { file_url, file_name, is_primary }
  let body: { file_url?: string; file_name?: string; is_primary?: boolean };
  try {
    body = (await req.json()) as { file_url?: string; file_name?: string; is_primary?: boolean };
  } catch {
    return Response.json(
      { error: 'Body inválido — envie JSON com file_url e file_name' },
      { status: 400 }
    );
  }

  const { file_url, file_name, is_primary } = body;
  if (!file_url) return Response.json({ error: 'file_url é obrigatório' }, { status: 400 });
  if (!file_name) return Response.json({ error: 'file_name é obrigatório' }, { status: 400 });

  // Extract storage_key from Uploadcare URL if applicable
  const storageKey = file_url.includes('ucarecdn.com')
    ? (file_url.split('ucarecdn.com/')[1]?.replace(/\//g, '') ?? '')
    : '';

  const [countForOrder] =
    await sql`SELECT COUNT(*) as cnt FROM business_images WHERE business_id = ${id}`;
  const displayOrder = parseInt(String(countForOrder?.cnt ?? '0'));

  // First image is always primary
  const finalIsPrimary = displayOrder === 0 || is_primary === true ? 1 : 0;

  const imageId = crypto.randomUUID();
  await sql`
    INSERT INTO business_images (id, business_id, storage_key, file_name, file_url, is_primary, display_order)
    VALUES (${imageId}, ${id}, ${storageKey}, ${file_name}, ${file_url}, ${finalIsPrimary}, ${displayOrder})
  `;

  const [image] = await sql`SELECT * FROM business_images WHERE id = ${imageId}`;
  return Response.json({ image });
}
