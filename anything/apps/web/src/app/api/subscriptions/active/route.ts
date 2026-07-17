import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const rows = await sql`
    SELECT subscription_level FROM user_profiles
    WHERE id = ${user.id} AND subscription_level IS NOT NULL AND subscription_level != 'none'
  `;

  if (rows[0]) {
    const level = rows[0].subscription_level as string;
    return Response.json({
      has_active_plan: true,
      plan_type: level,
      subscription: { plan_type: level, subscription_status: 'active' },
    });
  }
  return Response.json({ has_active_plan: false, plan_type: null, subscription: null });
}
