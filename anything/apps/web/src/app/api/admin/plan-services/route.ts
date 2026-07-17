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

    const services = await sql`SELECT * FROM plan_services ORDER BY plan_name, display_order ASC`;
    return Response.json({ services });
  } catch (error) {
    console.error('Error fetching plan services:', error);
    return Response.json({ error: 'Erro ao buscar serviços' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { plan_name, service_description, display_order, is_active } = await request.json();

    if (!plan_name || !service_description) {
      return Response.json(
        { error: 'plan_name e service_description são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['bronze', 'silver', 'gold'].includes(plan_name)) {
      return Response.json(
        { error: 'Plano inválido. Use: bronze, silver ou gold' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO plan_services (plan_name, service_description, display_order, is_active)
      VALUES (${plan_name}, ${service_description}, ${display_order ?? 0}, ${is_active ?? 1})
      RETURNING *
    `;
    return Response.json({ service: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan service:', error);
    return Response.json({ error: 'Erro ao criar serviço' }, { status: 500 });
  }
}
