import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { event, source, businessId } = body;

  if (event === 'plan_page_view') {
    await sql`UPDATE valuations SET last_plan_page_source = ${source || null} WHERE id = ${id}`.catch(
      () => null
    );
  }

  console.log('Tracked event:', { id, event, source, businessId });
  return Response.json({ success: true });
}
