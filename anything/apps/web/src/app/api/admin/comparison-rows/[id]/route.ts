import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
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

  const setClauses: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  if (section !== undefined) {
    setClauses.push(`section = $${idx++}`);
    values.push(section);
  }
  if (row_type !== undefined) {
    setClauses.push(`row_type = $${idx++}`);
    values.push(row_type);
  }
  if (label !== undefined) {
    setClauses.push(`label = $${idx++}`);
    values.push(label);
  }
  if (bronze_value !== undefined) {
    setClauses.push(`bronze_value = $${idx++}`);
    values.push(bronze_value);
  }
  if (silver_value !== undefined) {
    setClauses.push(`silver_value = $${idx++}`);
    values.push(silver_value);
  }
  if (gold_value !== undefined) {
    setClauses.push(`gold_value = $${idx++}`);
    values.push(gold_value);
  }
  if (display_order !== undefined) {
    setClauses.push(`display_order = $${idx++}`);
    values.push(display_order);
  }
  if (is_active !== undefined) {
    setClauses.push(`is_active = $${idx++}`);
    values.push(is_active);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const query = `UPDATE comparison_rows SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  const result = await sql(query, values);

  return Response.json({ row: result[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM comparison_rows WHERE id = ${id}`;
  return Response.json({ success: true });
}
