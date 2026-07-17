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

    const settings = await sql`SELECT * FROM system_settings ORDER BY category, setting_key`;
    return Response.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { setting_key, setting_value, setting_type, description, category } =
      await request.json();
    if (!setting_key || !category) {
      return Response.json({ error: 'setting_key e category são obrigatórios' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
      VALUES (${setting_key}, ${String(setting_value ?? '')}, ${setting_type || 'text'}, ${description || null}, ${category})
      ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value,
            updated_at = NOW()
      RETURNING *
    `;
    return Response.json({ setting: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return Response.json({ error: 'Erro ao criar configuração' }, { status: 500 });
  }
}
