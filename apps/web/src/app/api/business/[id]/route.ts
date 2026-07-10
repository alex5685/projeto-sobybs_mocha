import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// Fields that should be hidden from non-owners in the public marketplace
const PRIVATE_ADDRESS_FIELDS = ['cep', 'rua', 'numero', 'complemento', 'bairro'];

function stripPrivateFields(biz: Record<string, unknown>) {
  const stripped = { ...biz };
  for (const field of PRIVATE_ADDRESS_FIELDS) {
    delete stripped[field];
  }
  return stripped;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await sql`
    SELECT b.*, bd.* FROM businesses b
    LEFT JOIN business_details bd ON bd.business_id = b.id
    WHERE b.id = ${id}
  `;
  if (!business[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });

  const biz = business[0] as { is_public: number; owner_id: string; business_id: string };

  if (biz.is_public === 1) {
    // Check if the requester is the owner or admin — if so, return full data
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    if (user) {
      const isOwner = biz.owner_id === user.id;
      if (isOwner) {
        return Response.json({ business: { ...biz, business_id: id } });
      }
      const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
      if (profile[0]?.user_type === 'admin') {
        return Response.json({ business: { ...biz, business_id: id } });
      }
    }

    // Public visitor or non-owner: strip full address, keep only cidade/estado/pais
    return Response.json({ business: { ...stripPrivateFields(biz), business_id: id } });
  }

  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const isOwner = biz.owner_id === user.id;
  if (!isOwner) {
    const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (profile[0]?.user_type !== 'admin')
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
  }

  return Response.json({ business: { ...biz, business_id: id } });
}
