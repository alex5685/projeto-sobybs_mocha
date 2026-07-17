import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const businesses = await sql`
    SELECT b.id, b.alias_name, b.sector, b.city, b.status_workflow, b.is_public, b.created_at
    FROM businesses b
    WHERE b.owner_id = ${user.id}
    ORDER BY b.created_at DESC
  `;

  return Response.json({ businesses });
}
