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

    const jobs = await sql`SELECT * FROM team_jobs ORDER BY created_at DESC`;
    return Response.json({ jobs });
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    return Response.json({ error: 'Erro ao buscar vagas' }, { status: 500 });
  }
}
