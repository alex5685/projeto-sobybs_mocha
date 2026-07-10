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

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const members = await sql`SELECT * FROM team_members ORDER BY display_order ASC, id ASC`;
    return Response.json({ members });
  } catch (error) {
    console.error('Error fetching all team members:', error);
    return Response.json({ error: 'Erro ao buscar membros do time' }, { status: 500 });
  }
}
