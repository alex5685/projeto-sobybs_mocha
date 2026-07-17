import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// POST /api/profiles/me/upload-photo — update user profile photo
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = (await request.json()) as { photoUrl: string };
  const { photoUrl } = body;

  if (!photoUrl || !photoUrl.trim()) {
    return NextResponse.json({ error: 'URL da foto é obrigatória' }, { status: 400 });
  }

  // Update user image in user table
  await sql`
    UPDATE "user" 
    SET image = ${photoUrl.trim()}, "updatedAt" = NOW()
    WHERE id = ${session.user.id}
  `;

  return NextResponse.json({ success: true, photoUrl: photoUrl.trim() });
}
