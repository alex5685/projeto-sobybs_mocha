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
    const { name, role, bio, photo_url, email, display_order, is_active } = await request.json();

    const result = await sql`
      UPDATE team_members
      SET
        name = ${name},
        role = ${role},
        bio = ${bio || null},
        photo_url = ${photo_url || null},
        email = ${email || null},
        display_order = ${display_order ?? 0},
        is_active = ${is_active ?? 1},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    return Response.json({ member: result[0] });
  } catch (error) {
    console.error('Error updating team member:', error);
    return Response.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    await sql`DELETE FROM team_members WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return Response.json({ error: 'Erro ao deletar membro' }, { status: 500 });
  }
}
