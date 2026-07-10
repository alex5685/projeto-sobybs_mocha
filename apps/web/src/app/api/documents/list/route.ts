import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('business_id');

  if (businessId) {
    const business = await sql`SELECT owner_id FROM businesses WHERE id = ${businessId}`;
    if (!business[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    if (business[0].owner_id !== user.id) {
      const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
      if (profile[0]?.user_type !== 'admin')
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
    const docs =
      await sql`SELECT id, file_name, uploaded_at FROM secure_documents WHERE business_id = ${businessId} ORDER BY uploaded_at DESC`;
    return Response.json({ documents: docs });
  }

  const docs =
    await sql`SELECT id, file_name, uploaded_at FROM secure_documents WHERE business_id = ${'user:' + user.id} ORDER BY uploaded_at DESC`;
  return Response.json({ documents: docs });
}
