import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const docs = await sql`SELECT * FROM secure_documents WHERE id = ${id}`;
  if (!docs[0]) return Response.json({ error: 'Documento não encontrado' }, { status: 404 });

  const doc = docs[0] as { owner_id: string; business_id: string | null };

  // Check access
  if (doc.owner_id !== user.id) {
    const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (profile[0]?.user_type !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
  }

  return Response.json({ document: docs[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const docs = await sql`SELECT * FROM secure_documents WHERE id = ${id}`;
  if (!docs[0]) return Response.json({ error: 'Documento não encontrado' }, { status: 404 });

  const doc = docs[0] as { owner_id: string };

  if (doc.owner_id !== user.id) {
    const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (profile[0]?.user_type !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
  }

  await sql`DELETE FROM secure_documents WHERE id = ${id}`;
  return Response.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const docs = await sql`SELECT * FROM secure_documents WHERE id = ${id}`;
  if (!docs[0]) return Response.json({ error: 'Documento não encontrado' }, { status: 404 });

  const doc = docs[0] as { owner_id: string };
  if (doc.owner_id !== user.id) {
    const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (profile[0]?.user_type !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }
  }

  const body = (await req.json()) as { description?: string; category?: string };
  const setClauses: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  if (body.description !== undefined) {
    setClauses.push(`description = $${idx++}`);
    values.push(body.description);
  }
  if (body.category !== undefined) {
    setClauses.push(`category = $${idx++}`);
    values.push(body.category);
  }
  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const query = `UPDATE secure_documents SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  const result = await sql(query, values);
  return Response.json({ document: result[0] });
}
