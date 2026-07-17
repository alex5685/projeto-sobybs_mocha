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

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') ?? '';
  const search = url.searchParams.get('search') ?? '';

  try {
    // All subscriptions with user info
    const conditions: string[] = [];
    const values: string[] = [];
    let idx = 1;

    if (statusFilter) {
      conditions.push(`s.status = $${idx++}`);
      values.push(statusFilter);
    }
    if (search) {
      conditions.push(
        `(LOWER(u.name) LIKE LOWER($${idx++}) OR LOWER(u.email) LIKE LOWER($${idx++}))`
      );
      const like = `%${search}%`;
      values.push(like, like);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const subsQuery = `
      SELECT
        s.id, s.user_id, s.plan_type, s.status, s.monthly_value,
        s.starts_at, s.expires_at, s.cancelled_at,
        u.name as user_name, u.email as user_email, u."createdAt" as user_since,
        up.user_type
      FROM subscriptions s
      JOIN "user" u ON u.id = s.user_id
      LEFT JOIN user_profiles up ON up.id = s.user_id
      ${where}
      ORDER BY
        CASE s.status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END,
        s.expires_at ASC
    `;

    const subscriptions = await sql(subsQuery, values);

    // Summary counts
    const summaryRows = await sql`
      SELECT status, COUNT(*)::int as count, COALESCE(SUM(monthly_value), 0)::numeric as mrr
      FROM subscriptions
      GROUP BY status
    `;

    // Churn rate: cancelled this month / total at start of month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const churnRows = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM subscriptions WHERE cancelled_at >= ${firstOfMonth}) as cancelled_this_month,
        (SELECT COUNT(*)::int FROM subscriptions WHERE starts_at < ${firstOfMonth}) as total_start_of_month
    `;

    const cancelledThisMonth = churnRows[0]?.cancelled_this_month ?? 0;
    const totalStartOfMonth = churnRows[0]?.total_start_of_month ?? 1;
    const churnRate =
      totalStartOfMonth > 0 ? ((cancelledThisMonth / totalStartOfMonth) * 100).toFixed(1) : '0.0';

    // Expiring in 10 days
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const expiring = await sql`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM subscriptions s
      JOIN "user" u ON u.id = s.user_id
      WHERE s.status = 'active' AND s.expires_at <= ${tenDaysFromNow}
      ORDER BY s.expires_at ASC
    `;

    return Response.json({
      subscriptions,
      summary: summaryRows,
      churnRate,
      cancelledThisMonth,
      expiringCount: expiring.length,
      expiring,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return Response.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 });
  }
}

// Update subscription status
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const body = (await req.json()) as { id: string; status: string; expires_at?: string };
    const { id, status, expires_at } = body;

    if (status === 'cancelled') {
      await sql`
        UPDATE subscriptions
        SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      const expiry = expires_at ?? null;
      await sql`
        UPDATE subscriptions
        SET status = ${status}, expires_at = ${expiry}, cancelled_at = NULL, updated_at = NOW()
        WHERE id = ${id}
      `;
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return Response.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 });
  }
}
