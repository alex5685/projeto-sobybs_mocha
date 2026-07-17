import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// Emails que têm acesso admin automático
const ADMIN_EMAILS = ['sobybs@gmail.com'];

// GET /api/profiles/me — retorna perfil + nome/imagem diretamente do banco
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(session.user.email);

  // JOIN com user para pegar nome/imagem sempre frescos do banco
  const rows = await sql`
    SELECT up.*, u.name AS user_name, u.email AS user_email, u.image AS user_image
    FROM "user" u
    LEFT JOIN user_profiles up ON up.id = u.id
    WHERE u.id = ${session.user.id}
  `;
  const profile = rows[0] ?? null;

  // Auto-criar ou promover perfil admin para emails privilegiados
  if (isAdmin && (!profile || profile.user_type !== 'admin')) {
    await sql`
      INSERT INTO user_profiles (id, email, user_type, subscription_level, created_at, updated_at)
      VALUES (${session.user.id}, ${session.user.email}, 'admin', 'gold', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET user_type = 'admin', updated_at = NOW()
    `;
    const updated = await sql`
      SELECT up.*, u.name AS user_name, u.email AS user_email, u.image AS user_image
      FROM "user" u
      LEFT JOIN user_profiles up ON up.id = u.id
      WHERE u.id = ${session.user.id}
    `;
    return NextResponse.json(updated[0]);
  }

  return NextResponse.json(
    profile ?? {
      user_name: session.user.name,
      user_email: session.user.email,
      user_image: session.user.image,
      user_type: 'basico',
    }
  );
}

// PATCH /api/profiles/me — atualiza o nome do usuário
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { name?: string };
  const { name } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });
  }

  await sql`UPDATE "user" SET name = ${name.trim()}, "updatedAt" = NOW() WHERE id = ${session.user.id}`;

  return NextResponse.json({ success: true, name: name.trim() });
}

// POST /api/profiles/me — cria ou atualiza o perfil
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { user_type?: string; subscription_level?: string };
  const { user_type, subscription_level } = body;

  const isAdmin = ADMIN_EMAILS.includes(session.user.email);
  const effectiveType = isAdmin ? 'admin' : user_type;

  const validTypes = ['basico', 'comprador', 'vendedor', 'hibrido', 'admin'];
  if (!effectiveType || !validTypes.includes(effectiveType)) {
    return NextResponse.json({ error: 'Tipo de perfil inválido' }, { status: 400 });
  }

  const level = subscription_level || (isAdmin ? 'gold' : 'none');
  const userId = session.user.id;
  const email = session.user.email;

  await sql`
    INSERT INTO user_profiles (id, email, user_type, subscription_level, created_at, updated_at)
    VALUES (${userId}, ${email}, ${effectiveType}, ${level}, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET user_type = ${effectiveType}, subscription_level = ${level}, updated_at = NOW()
  `;

  const updated = await sql`
    SELECT up.*, u.name AS user_name, u.email AS user_email, u.image AS user_image
    FROM "user" u
    LEFT JOIN user_profiles up ON up.id = u.id
    WHERE u.id = ${userId}
  `;
  return NextResponse.json(updated[0]);
}
