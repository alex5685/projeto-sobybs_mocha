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

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { key } = await params;
    const { value } = await request.json();

    if (value === undefined || value === null) {
      return Response.json({ error: 'Valor é obrigatório' }, { status: 400 });
    }

    const result = await sql`
      UPDATE system_settings
      SET setting_value = ${String(value)}, updated_at = NOW()
      WHERE setting_key = ${key}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: 'Configuração não encontrada' }, { status: 404 });
    }

    return Response.json({ setting: result[0] });
  } catch (error) {
    console.error('Error updating setting:', error);
    return Response.json({ error: 'Erro ao atualizar configuração' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { key } = await params;
    await sql`DELETE FROM system_settings WHERE setting_key = ${key}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return Response.json({ error: 'Erro ao deletar configuração' }, { status: 500 });
  }
}
