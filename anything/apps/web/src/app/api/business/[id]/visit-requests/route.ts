import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// POST — buyer creates a visit request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  // Cannot schedule a visit for your own business
  const [biz] = await sql`SELECT owner_id FROM businesses WHERE id = ${businessId}`;
  if (!biz) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
  if (biz.owner_id === user.id)
    return Response.json(
      { error: 'Você não pode agendar uma visita à sua própria empresa' },
      { status: 400 }
    );

  const body = (await req.json()) as {
    preferred_date: string;
    preferred_time?: string;
    message?: string;
  };

  if (!body.preferred_date)
    return Response.json({ error: 'Data preferida é obrigatória' }, { status: 400 });

  // Prevent duplicate pending requests from same buyer
  const existing = await sql`
    SELECT id FROM visit_requests
    WHERE business_id = ${businessId} AND buyer_id = ${user.id} AND status = 'pending'
    LIMIT 1
  `;
  if (existing.length > 0)
    return Response.json(
      { error: 'Você já possui uma solicitação de visita pendente para esta empresa' },
      { status: 409 }
    );

  const id = crypto.randomUUID();
  const [created] = await sql`
    INSERT INTO visit_requests (id, business_id, buyer_id, preferred_date, preferred_time, message)
    VALUES (
      ${id},
      ${businessId},
      ${user.id},
      ${body.preferred_date},
      ${body.preferred_time ?? null},
      ${body.message ?? null}
    )
    RETURNING *
  `;

  return Response.json({ visit_request: created }, { status: 201 });
}

// GET — owner sees all requests for a business; buyer sees only their own
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const [biz] = await sql`SELECT owner_id FROM businesses WHERE id = ${businessId}`;
  if (!biz) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });

  const isOwner = biz.owner_id === user.id;

  if (isOwner) {
    // Owner sees all, joined with buyer name/email
    const requests = await sql`
      SELECT vr.*, u.name AS buyer_name, u.email AS buyer_email
      FROM visit_requests vr
      JOIN "user" u ON u.id = vr.buyer_id
      WHERE vr.business_id = ${businessId}
      ORDER BY vr.created_at DESC
    `;
    return Response.json({ visit_requests: requests });
  }

  // Buyer sees only their own requests
  const requests = await sql`
    SELECT * FROM visit_requests
    WHERE business_id = ${businessId} AND buyer_id = ${user.id}
    ORDER BY created_at DESC
  `;
  return Response.json({ visit_requests: requests });
}
