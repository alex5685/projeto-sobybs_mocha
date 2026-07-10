import { NextRequest } from 'next/server';
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
  const jobs = await sql`SELECT * FROM team_jobs WHERE is_active = 1 ORDER BY created_at DESC`;
  return Response.json({ jobs });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { title, department, location, employment_type, description, requirements, is_active } =
      await request.json();

    if (!title || !description) {
      return Response.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO team_jobs (title, department, location, employment_type, description, requirements, is_active)
      VALUES (${title}, ${department || null}, ${location || null}, ${employment_type || null}, ${description}, ${requirements || null}, ${is_active ?? 1})
      RETURNING *
    `;
    return Response.json({ job: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return Response.json({ error: 'Erro ao criar vaga' }, { status: 500 });
  }
}
