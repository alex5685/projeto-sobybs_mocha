import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql`SELECT * FROM quick_valuations WHERE id = ${id}`;
  if (!rows[0]) return Response.json({ valuation: null }, { status: 404 });
  return Response.json({ valuation: rows[0] });
}
