import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const expired = await sql`
    SELECT qv.id, qv.business_id, b.alias_name as business_name, qv.created_at
    FROM quick_valuations qv
    JOIN businesses b ON b.id = qv.business_id
    WHERE b.owner_id = ${user.id} AND qv.notified_expiration = 0 AND qv.created_at < ${sevenDaysAgo}
    ORDER BY qv.created_at DESC
  `;

  return Response.json({ expired_valuations: expired });
}
