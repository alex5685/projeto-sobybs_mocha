import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

export async function GET() {
  const rows = await sql`
    SELECT * FROM comparison_rows
    ORDER BY section, display_order
  `;
  return Response.json({ rows });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    section,
    row_type,
    label,
    bronze_value,
    silver_value,
    gold_value,
    display_order,
    is_active,
  } = body;

  const result = await sql`
    INSERT INTO comparison_rows (section, row_type, label, bronze_value, silver_value, gold_value, display_order, is_active)
    VALUES (
      ${section ?? 'geral'},
      ${row_type ?? 'feature'},
      ${label},
      ${bronze_value ?? ''},
      ${silver_value ?? ''},
      ${gold_value ?? ''},
      ${display_order ?? 0},
      ${is_active ?? 1}
    )
    RETURNING *
  `;
  return Response.json({ row: result[0] });
}
