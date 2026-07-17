import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
  const userType = profile[0]?.user_type;
  if (!userType || !['comprador', 'vendedor', 'hibrido', 'admin'].includes(userType)) {
    return Response.json({ error: 'Tipo de usuário não autorizado' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ error: 'Arquivo não enviado' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024)
    return Response.json({ error: 'Arquivo muito grande (máx 10MB)' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('business_id');

  let finalBusinessId = `user:${user.id}`;
  let accessLevel = 'private';

  if (businessId) {
    const business = await sql`SELECT owner_id FROM businesses WHERE id = ${businessId}`;
    if (!business[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    if (business[0].owner_id !== user.id && userType !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
    finalBusinessId = businessId;
    accessLevel = 'business';
  }

  // Placeholder: would upload to R2 here
  const docUrl = `https://placeholder.com/docs/${Date.now()}-${file.name}`;
  const docId = crypto.randomUUID();

  await sql`
    INSERT INTO secure_documents (id, business_id, file_name, original_name, content_type, file_size, url, access_level, uploaded_by)
    VALUES (${docId}, ${finalBusinessId}, ${file.name}, ${file.name}, ${file.type}, ${file.size}, ${docUrl}, ${accessLevel}, ${user.id})
  `;

  return Response.json({ success: true, id: docId });
}
