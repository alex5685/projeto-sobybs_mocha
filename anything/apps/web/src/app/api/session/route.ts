import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// Always fetch fresh — never cache this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the latest user data directly from DB so name/image updates
  // are reflected immediately, bypassing any better-auth session cache.
  const rows =
    await sql`SELECT id, name, email, image, "emailVerified", "createdAt", "updatedAt" FROM "user" WHERE id = ${session.user.id}`;
  const freshUser = rows[0] ?? null;

  return NextResponse.json({
    user: freshUser
      ? { ...session.user, name: freshUser.name, image: freshUser.image }
      : session.user,
    session: session.session,
  });
}
