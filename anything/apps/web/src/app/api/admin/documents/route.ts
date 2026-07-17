import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

// GET /api/admin/documents — admin view of all documents
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
  if (profile[0]?.user_type !== 'admin') {
    return Response.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const businessId = searchParams.get('business_id');
  const userId = searchParams.get('user_id');

  const setClauses: string[] = ['1=1'];
  const values: (string | number)[] = [];
  let idx = 1;

  if (category) {
    setClauses.push(`d.category = $${idx++}`);
    values.push(category);
  }
  if (businessId) {
    setClauses.push(`d.business_id = $${idx++}`);
    values.push(businessId);
  }
  if (userId) {
    setClauses.push(`d.owner_id = $${idx++}`);
    values.push(userId);
  }
  if (search) {
    setClauses.push(
      `(LOWER(d.file_name) LIKE $${idx} OR LOWER(u.name) LIKE $${idx} OR LOWER(d.description) LIKE $${idx})`
    );
    values.push(`%${search.toLowerCase()}%`);
    idx++;
  }

  const whereClause = setClauses.join(' AND ');
  const query = `
    SELECT
      d.*,
      u.name as owner_name,
      u.email as owner_email,
      b.alias_name as business_name
    FROM secure_documents d
    LEFT JOIN "user" u ON u.id = d.owner_id
    LEFT JOIN businesses b ON b.id = d.business_id
    WHERE ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT 200
  `;

  const docs = await sql(query, values);
  return Response.json({ documents: docs });
}
