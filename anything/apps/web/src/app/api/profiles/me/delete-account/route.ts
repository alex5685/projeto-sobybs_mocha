import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// DELETE /api/profiles/me/delete-account — permanently delete user account and all data
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = session.user.id;

  try {
    // Delete all user data in transaction
    // Foreign keys with ON DELETE CASCADE will handle related records automatically
    await sql`DELETE FROM "user" WHERE id = ${userId}`;

    // Invalidate all sessions
    await auth.api.signOut({ headers: request.headers });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Erro ao deletar conta' }, { status: 500 });
  }
}
