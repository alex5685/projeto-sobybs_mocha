import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';
import { hash, verify } from '@node-rs/argon2';

// POST /api/profiles/me/change-password — change user password
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = (await request.json()) as { currentPassword: string; newPassword: string };
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Senha atual e nova senha são obrigatórias' },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'A nova senha deve ter pelo menos 8 caracteres' },
      { status: 400 }
    );
  }

  // Get user's current password hash from account table
  const accounts = await sql`
    SELECT password FROM account 
    WHERE "userId" = ${session.user.id} AND "providerId" = 'credential'
  `;

  if (accounts.length === 0 || !accounts[0].password) {
    return NextResponse.json({ error: 'Conta não usa senha (login social)' }, { status: 400 });
  }

  // Verify current password
  const isValid = await verify(accounts[0].password, currentPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 });
  }

  // Hash new password
  const newHash = await hash(newPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Update password
  await sql`
    UPDATE account 
    SET password = ${newHash}, "updatedAt" = NOW()
    WHERE "userId" = ${session.user.id} AND "providerId" = 'credential'
  `;

  return NextResponse.json({ success: true });
}
