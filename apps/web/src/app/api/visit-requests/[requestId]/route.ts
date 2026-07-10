import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// PATCH — update visit request status
// Owner: confirm → releases address, reject → denies
// Buyer: cancel their own pending request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const [visitReq] = await sql`
    SELECT vr.*, b.owner_id FROM visit_requests vr
    JOIN businesses b ON b.id = vr.business_id
    WHERE vr.id = ${requestId}
  `;
  if (!visitReq) return Response.json({ error: 'Solicitação não encontrada' }, { status: 404 });

  const isOwner = visitReq.owner_id === user.id;
  const isBuyer = visitReq.buyer_id === user.id;

  if (!isOwner && !isBuyer) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const body = (await req.json()) as { status: string };
  const { status } = body;

  // Validate allowed transitions
  if (isOwner && !['confirmed', 'rejected'].includes(status))
    return Response.json({ error: 'Status inválido para o proprietário' }, { status: 400 });
  if (isBuyer && status !== 'cancelled')
    return Response.json({ error: 'Comprador só pode cancelar a solicitação' }, { status: 400 });

  // When owner confirms, address is released
  const addressReleased = isOwner && status === 'confirmed' ? 1 : visitReq.address_released;

  const [updated] = await sql`
    UPDATE visit_requests
    SET status = ${status}, address_released = ${addressReleased}, updated_at = NOW()
    WHERE id = ${requestId}
    RETURNING *
  `;

  // If confirmed, return full address so the caller can show it
  let fullAddress: Record<string, unknown> | null = null;
  if (status === 'confirmed') {
    const [details] = await sql`
      SELECT cep, rua, numero, complemento, bairro, cidade, estado, pais
      FROM business_details WHERE business_id = ${visitReq.business_id}
    `;
    if (details) fullAddress = details as Record<string, unknown>;
  }

  return Response.json({ visit_request: updated, full_address: fullAddress });
}

// GET — buyer retrieves their own request (to check status + get address if confirmed)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const [visitReq] = await sql`
    SELECT vr.*, b.owner_id FROM visit_requests vr
    JOIN businesses b ON b.id = vr.business_id
    WHERE vr.id = ${requestId}
  `;
  if (!visitReq) return Response.json({ error: 'Solicitação não encontrada' }, { status: 404 });

  const isOwner = visitReq.owner_id === user.id;
  const isBuyer = visitReq.buyer_id === user.id;
  if (!isOwner && !isBuyer) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  let fullAddress: Record<string, unknown> | null = null;
  if (visitReq.address_released === 1 && isBuyer) {
    const [details] = await sql`
      SELECT cep, rua, numero, complemento, bairro, cidade, estado, pais
      FROM business_details WHERE business_id = ${visitReq.business_id}
    `;
    if (details) fullAddress = details as Record<string, unknown>;
  }

  return Response.json({ visit_request: visitReq, full_address: fullAddress });
}
