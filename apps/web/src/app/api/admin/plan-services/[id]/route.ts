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
    const { service_description, display_order, is_active } = await request.json();

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (service_description !== undefined) {
      setClauses.push(`service_description = $${idx++}`);
      values.push(service_description);
    }
    if (display_order !== undefined) {
      setClauses.push(`display_order = $${idx++}`);
      values.push(display_order);
    }
    if (is_active !== undefined) {
      setClauses.push(`is_active = $${idx++}`);
      values.push(is_active ? 1 : 0);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await sql(
      `UPDATE plan_services SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.length === 0) {
      return Response.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    return Response.json({ service: result[0] });
  } catch (error) {
    console.error('Error updating plan service:', error);
    return Response.json({ error: 'Erro ao atualizar serviço' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { id } = await params;
    await sql`DELETE FROM plan_services WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan service:', error);
    return Response.json({ error: 'Erro ao deletar serviço' }, { status: 500 });
  }
}
