import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

// GET /api/documents — list user's own documents (with optional ?business_id=)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('business_id');
  const category = searchParams.get('category');

  let docs;
  if (businessId) {
    // Check access: owner or admin
    const biz = await sql`SELECT owner_id FROM businesses WHERE id = ${businessId}`;
    if (!biz[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    const isAdmin = profile[0]?.user_type === 'admin';
    if (biz[0].owner_id !== user.id && !isAdmin) {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
    docs = category
      ? await sql`SELECT d.*, u.name as uploader_name FROM secure_documents d LEFT JOIN "user" u ON u.id = d.uploaded_by WHERE d.business_id = ${businessId} AND d.category = ${category} ORDER BY d.created_at DESC`
      : await sql`SELECT d.*, u.name as uploader_name FROM secure_documents d LEFT JOIN "user" u ON u.id = d.uploaded_by WHERE d.business_id = ${businessId} ORDER BY d.created_at DESC`;
  } else {
    docs = category
      ? await sql`SELECT d.*, u.name as uploader_name FROM secure_documents d LEFT JOIN "user" u ON u.id = d.uploaded_by WHERE d.owner_id = ${user.id} AND d.business_id IS NULL AND d.category = ${category} ORDER BY d.created_at DESC`
      : await sql`SELECT d.*, u.name as uploader_name FROM secure_documents d LEFT JOIN "user" u ON u.id = d.uploaded_by WHERE d.owner_id = ${user.id} AND d.business_id IS NULL ORDER BY d.created_at DESC`;
  }

  return Response.json({ documents: docs });
}

// POST /api/documents — save document metadata after frontend upload
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
  const userType = profile[0]?.user_type;
  if (!userType || !['comprador', 'vendedor', 'hibrido', 'admin'].includes(userType)) {
    return Response.json({ error: 'Perfil sem permissão para enviar documentos' }, { status: 403 });
  }

  const body = (await req.json()) as {
    file_name: string;
    file_url: string;
    file_type: string;
    file_size?: number;
    category: string;
    description?: string;
    business_id?: string;
  };

  const { file_name, file_url, file_type, file_size, category, description, business_id } = body;

  if (!file_name || !file_url) {
    return Response.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  // Validate business ownership if provided
  if (business_id) {
    const biz = await sql`SELECT owner_id FROM businesses WHERE id = ${business_id}`;
    if (!biz[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    if (biz[0].owner_id !== user.id && userType !== 'admin') {
      return Response.json({ error: 'Acesso negado à empresa' }, { status: 403 });
    }
  }

  const docId = crypto.randomUUID();

  const result = await sql`
    INSERT INTO secure_documents (
      id, owner_id, business_id, file_name, file_url, file_type,
      file_size, category, description, uploaded_by
    )
    VALUES (
      ${docId}, ${user.id}, ${business_id ?? null}, ${file_name}, ${file_url},
      ${file_type ?? 'outros'}, ${file_size ?? null}, ${category ?? 'outros'},
      ${description ?? null}, ${user.id}
    )
    RETURNING *
  `;

  return Response.json({ document: result[0] }, { status: 201 });
}
