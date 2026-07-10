import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const doc = await sql`SELECT * FROM secure_documents WHERE id = ${id}`;
  if (!doc[0]) return Response.json({ error: 'Documento não encontrado' }, { status: 404 });

  const d = doc[0] as { business_id: string; uploaded_by: string };
  if (d.business_id.startsWith('user:')) {
    const ownerId = d.business_id.replace('user:', '');
    if (ownerId !== user.id) {
      const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
      if (profile[0]?.user_type !== 'admin')
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
  } else {
    const business = await sql`SELECT owner_id FROM businesses WHERE id = ${d.business_id}`;
    if (!business[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    if (business[0].owner_id !== user.id) {
      const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
      if (profile[0]?.user_type !== 'admin')
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
  }

  await sql`DELETE FROM secure_documents WHERE id = ${id}`;
  return Response.json({ success: true });
}
