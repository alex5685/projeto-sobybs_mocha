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
  const members =
    await sql`SELECT * FROM team_members WHERE is_active = 1 ORDER BY display_order ASC, id ASC`;
  return Response.json({ members });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { name, role, bio, photo_url, email, display_order, is_active } = await request.json();

    if (!name || !role) {
      return Response.json({ error: 'Nome e cargo são obrigatórios' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO team_members (name, role, bio, photo_url, email, display_order, is_active)
      VALUES (${name}, ${role}, ${bio || null}, ${photo_url || null}, ${email || null}, ${display_order ?? 0}, ${is_active ?? 1})
      RETURNING *
    `;
    return Response.json({ member: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return Response.json({ error: 'Erro ao criar membro do time' }, { status: 500 });
  }
}
