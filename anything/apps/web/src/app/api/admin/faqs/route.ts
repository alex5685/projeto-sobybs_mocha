import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const rows = await sql`SELECT user_type FROM user_profiles WHERE id = ${session.user.id}`;
  if (!rows[0] || rows[0].user_type !== 'admin') return null;
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const faqs = await sql`SELECT * FROM faqs ORDER BY display_order ASC, id ASC`;
    return Response.json({ faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return Response.json({ error: 'Erro ao buscar FAQs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const { question, answer, display_order, is_active } = await request.json();
    if (!question || !answer) {
      return Response.json({ error: 'Pergunta e resposta são obrigatórias' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO faqs (question, answer, display_order, is_active)
      VALUES (${question}, ${answer}, ${display_order ?? 0}, ${is_active ?? 1})
      RETURNING *
    `;
    return Response.json({ faq: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return Response.json({ error: 'Erro ao criar FAQ' }, { status: 500 });
  }
}
