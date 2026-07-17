import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const rows = await sql`SELECT user_type FROM user_profiles WHERE id = ${session.user.id}`;
  if (!rows[0] || rows[0].user_type !== 'admin') return null;
  return session;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return Response.json({ error: 'Status é obrigatório' }, { status: 400 });
    }

    await sql`
      UPDATE team_applications
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating application status:', error);
    return Response.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
