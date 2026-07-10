import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// Emails que têm acesso admin automático
const ADMIN_EMAILS = ['sobybs@gmail.com'];

// GET /api/profiles/me — retorna o perfil do utilizador logado
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(session.user.email);
  const rows = await sql`SELECT * FROM user_profiles WHERE id = ${session.user.id}`;
  const profile = rows[0] ?? null;

  // Auto-criar ou promover perfil admin para emails privilegiados
  if (isAdmin && (!profile || profile.user_type !== 'admin')) {
    if (!profile) {
      await sql`
        INSERT INTO user_profiles (id, email, user_type, subscription_level, created_at, updated_at)
        VALUES (${session.user.id}, ${session.user.email}, 'admin', 'gold', NOW(), NOW())
      `;
    } else {
      await sql`
        UPDATE user_profiles SET user_type = 'admin', updated_at = NOW()
        WHERE id = ${session.user.id}
      `;
    }
    const updated = await sql`SELECT * FROM user_profiles WHERE id = ${session.user.id}`;
    return NextResponse.json(updated[0]);
  }

  return NextResponse.json(profile ?? null);
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

  // Admin emails sempre mantêm o tipo admin
  const isAdmin = ADMIN_EMAILS.includes(session.user.email);
  const effectiveType = isAdmin ? 'admin' : user_type;

  const validTypes = ['basico', 'comprador', 'vendedor', 'hibrido', 'admin'];
  if (!effectiveType || !validTypes.includes(effectiveType)) {
    return NextResponse.json({ error: 'Tipo de perfil inválido' }, { status: 400 });
  }

  const level = subscription_level || (isAdmin ? 'gold' : 'none');
  const userId = session.user.id;
  const email = session.user.email;

  const existing = await sql`SELECT id FROM user_profiles WHERE id = ${userId}`;

  if (existing.length > 0) {
    await sql`
      UPDATE user_profiles
      SET user_type = ${effectiveType}, subscription_level = ${level}, updated_at = NOW()
      WHERE id = ${userId}
    `;
  } else {
    await sql`
      INSERT INTO user_profiles (id, email, user_type, subscription_level, created_at, updated_at)
      VALUES (${userId}, ${email}, ${effectiveType}, ${level}, NOW(), NOW())
    `;
  }

  const updated = await sql`SELECT * FROM user_profiles WHERE id = ${userId}`;
  return NextResponse.json(updated[0]);
}
