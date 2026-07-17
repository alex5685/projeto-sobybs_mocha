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
  const session = await requireAdmin();
  if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const [clients, businesses] = await sql.transaction([
      sql`
        SELECT u.id, u.name, u.email, up.user_type, up.subscription_level
        FROM "user" u
        LEFT JOIN user_profiles up ON up.id = u.id
        WHERE up.user_type != 'admin' OR up.user_type IS NULL
        ORDER BY u.name ASC
        LIMIT 200
      `,
      sql`
        SELECT b.id, b.alias_name, b.sector, b.city, b.status_workflow,
               u.name as owner_name, u.email as owner_email
        FROM businesses b
        LEFT JOIN "user" u ON u.id = b.owner_id
        ORDER BY b.alias_name ASC
        LIMIT 200
      `,
    ]);

    return Response.json({ clients, businesses });
  } catch (error) {
    console.error('Error fetching clients/businesses:', error);
    return Response.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
