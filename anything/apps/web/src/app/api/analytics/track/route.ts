import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      visitorId: string;
      path: string;
      referrer?: string;
    };

    if (!body.visitorId || !body.path) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try to get the current user session (optional — anonymous visits are also tracked)
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      userId = session?.user?.id ?? null;
    } catch {
      // Silently ignore session errors — anonymous tracking still works
    }

    const ua = request.headers.get('user-agent') ?? null;

    await sql`
      INSERT INTO page_views (visitor_id, user_id, path, referrer, user_agent)
      VALUES (
        ${body.visitorId},
        ${userId},
        ${body.path},
        ${body.referrer ?? null},
        ${ua}
      )
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
