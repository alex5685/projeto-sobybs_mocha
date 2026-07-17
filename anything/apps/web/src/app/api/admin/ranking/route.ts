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
    // Top clients by revenue from financial entries
    const clientRanking = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        up.subscription_level,
        up.user_type,
        COUNT(fe.id)::int as num_lancamentos,
        COALESCE(SUM(CASE WHEN fe.entry_type = 'receita' THEN fe.amount ELSE 0 END), 0)::numeric as total_receita,
        COALESCE(SUM(CASE WHEN fe.entry_type = 'despesa' THEN fe.amount ELSE 0 END), 0)::numeric as total_despesa,
        MAX(fe.entry_date)::text as ultimo_lancamento
      FROM "user" u
      LEFT JOIN user_profiles up ON up.id = u.id
      LEFT JOIN financial_entries fe ON fe.client_user_id = u.id
      WHERE fe.client_user_id IS NOT NULL
      GROUP BY u.id, u.name, u.email, up.subscription_level, up.user_type
      ORDER BY total_receita DESC
      LIMIT 20
    `;

    // Top businesses by revenue
    const businessRanking = await sql`
      SELECT
        b.id,
        b.alias_name,
        b.sector,
        b.city,
        b.status_workflow,
        u.name as owner_name,
        u.email as owner_email,
        COUNT(fe.id)::int as num_lancamentos,
        COALESCE(SUM(CASE WHEN fe.entry_type = 'receita' THEN fe.amount ELSE 0 END), 0)::numeric as total_receita,
        COALESCE(SUM(CASE WHEN fe.entry_type = 'despesa' THEN fe.amount ELSE 0 END), 0)::numeric as total_despesa,
        MAX(fe.entry_date)::text as ultimo_lancamento
      FROM businesses b
      LEFT JOIN "user" u ON u.id = b.owner_id
      LEFT JOIN financial_entries fe ON fe.business_id = b.id
      WHERE fe.business_id IS NOT NULL
      GROUP BY b.id, b.alias_name, b.sector, b.city, b.status_workflow, u.name, u.email
      ORDER BY total_receita DESC
      LIMIT 20
    `;

    // Total revenue for percentage calculation
    const totalsRow = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN entry_type = 'receita' THEN amount ELSE 0 END), 0)::numeric as total_receita,
        COALESCE(SUM(CASE WHEN entry_type = 'despesa' THEN amount ELSE 0 END), 0)::numeric as total_despesa
      FROM financial_entries
    `;

    const grandTotal = Number(totalsRow[0]?.total_receita ?? 0);

    return Response.json({
      clientRanking,
      businessRanking,
      grandTotal,
    });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return Response.json({ error: 'Erro ao buscar ranking' }, { status: 500 });
  }
}
