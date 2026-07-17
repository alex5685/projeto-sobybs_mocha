import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import { randomBytes } from 'crypto';

// POST /api/auth/forgot-password — send password reset email
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email: string };
  const { email } = body;

  if (!email || !email.trim()) {
    return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
  }

  try {
    // Check if user exists
    const users = await sql`SELECT id FROM "user" WHERE email = ${email.trim().toLowerCase()}`;

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return NextResponse.json({ success: true });
    }

    const userId = users[0].id;

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in verification table
    await sql`
      INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
      VALUES (
        ${randomBytes(16).toString('hex')},
        ${email.trim().toLowerCase()},
        ${token},
        ${expiresAt.toISOString()},
        NOW(),
        NOW()
      )
    `;

    // TODO: Send email with reset link
    // For now, just log the token (in production, integrate with email service)
    const resetLink = `${process.env.NEXT_PUBLIC_CREATE_APP_URL || 'http://localhost:3000'}/account/reset-password?token=${token}`;
    console.log(`[forgot-password] Reset link for ${email}: ${resetLink}`);

    // In production, you would send an email here:
    // await sendEmail({
    //   to: email,
    //   subject: 'Redefinir sua senha - Sobybs',
    //   html: `<p>Clique no link para redefinir sua senha: <a href="${resetLink}">${resetLink}</a></p>`
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
  }
}
