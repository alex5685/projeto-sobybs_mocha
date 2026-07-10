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
    const { title, department, location, employment_type, description, requirements, is_active } =
      await request.json();

    const result = await sql`
      UPDATE team_jobs
      SET
        title = ${title},
        department = ${department || null},
        location = ${location || null},
        employment_type = ${employment_type || null},
        description = ${description},
        requirements = ${requirements || null},
        is_active = ${is_active ?? 1},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    return Response.json({ job: result[0] });
  } catch (error) {
    console.error('Error updating job:', error);
    return Response.json({ error: 'Erro ao atualizar vaga' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    await sql`DELETE FROM team_jobs WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return Response.json({ error: 'Erro ao deletar vaga' }, { status: 500 });
  }
}
