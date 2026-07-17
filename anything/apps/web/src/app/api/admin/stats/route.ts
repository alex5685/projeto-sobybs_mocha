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

    const [usersCount, businessesCount, usersByType] = await sql.transaction([
      sql`SELECT COUNT(*)::int as count FROM user_profiles`,
      sql`SELECT COUNT(*)::int as count FROM businesses`,
      sql`SELECT user_type, COUNT(*)::int as count FROM user_profiles GROUP BY user_type`,
    ]);

    // Try subscriptions table, but gracefully handle if it doesn't exist
    let activeSubscriptions = 0;
    let monthlyRevenue = 0;
    let subscriptionsByPlan: Array<{ plan_type: string; count: number }> = [];

    try {
      const [subCount, subRevenue, subByPlan] = await sql.transaction([
        sql`SELECT COUNT(*)::int as count FROM subscriptions WHERE status = 'active'`,
        sql`SELECT COALESCE(SUM(monthly_value), 0)::numeric as total FROM subscriptions WHERE status = 'active'`,
        sql`SELECT plan_type, COUNT(*)::int as count FROM subscriptions WHERE status = 'active' GROUP BY plan_type`,
      ]);
      activeSubscriptions = subCount[0]?.count ?? 0;
      monthlyRevenue = Number(subRevenue[0]?.total ?? 0);
      subscriptionsByPlan = subByPlan as Array<{ plan_type: string; count: number }>;
    } catch {
      // subscriptions table doesn't exist yet — ignore
    }

    return Response.json({
      stats: {
        totalUsers: usersCount[0]?.count ?? 0,
        totalBusinesses: businessesCount[0]?.count ?? 0,
        activeSubscriptions,
        monthlyRevenue,
        usersByType,
        subscriptionsByPlan,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return Response.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
