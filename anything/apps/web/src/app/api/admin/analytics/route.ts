import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin
    const profileRows = await sql`
      SELECT user_type FROM user_profiles WHERE id = ${session.user.id}
    `;
    if (!profileRows[0] || profileRows[0].user_type !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── General stats ──────────────────────────────────────────────────────
    const [
      totalViewsRow,
      uniqueVisitorsRow,
      uniqueUsersRow,
      viewsTodayRow,
      viewsYesterdayRow,
      viewsThisWeekRow,
      viewsThisMonthRow,
    ] = await sql.transaction([
      sql`SELECT COUNT(*)::int AS total FROM page_views`,
      sql`SELECT COUNT(DISTINCT visitor_id)::int AS total FROM page_views`,
      sql`SELECT COUNT(DISTINCT user_id)::int AS total FROM page_views WHERE user_id IS NOT NULL`,
      sql`SELECT COUNT(*)::int AS total FROM page_views WHERE created_at >= CURRENT_DATE`,
      sql`SELECT COUNT(*)::int AS total FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE`,
      sql`SELECT COUNT(*)::int AS total FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`,
      sql`SELECT COUNT(*)::int AS total FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`,
    ]);

    // Daily views for the last 30 days (chart)
    const dailyViews = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'DD/MM') AS day,
        DATE_TRUNC('day', created_at) AS raw_day,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS visitors,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS auth_users
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY raw_day ASC
    `;

    // Top pages (last 30 days)
    const topPages = await sql`
      SELECT
        path,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 15
    `;

    // ── Segmented stats ────────────────────────────────────────────────────

    // Auth vs anon overall (last 30 days)
    const segmentOverall = await sql`
      SELECT
        CASE WHEN user_id IS NOT NULL THEN 'authenticated' ELSE 'anonymous' END AS segment,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY (user_id IS NOT NULL)
    `;

    // Top pages for authenticated users (last 30 days)
    const topPagesAuth = await sql`
      SELECT
        path,
        COUNT(*)::int AS views,
        COUNT(DISTINCT user_id)::int AS unique_users
      FROM page_views
      WHERE user_id IS NOT NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `;

    // Top pages for anonymous visitors (last 30 days)
    const topPagesAnon = await sql`
      SELECT
        path,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM page_views
      WHERE user_id IS NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `;

    // Hourly distribution today
    const hourlyToday = await sql`
      SELECT
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views
      WHERE created_at >= CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour ASC
    `;

    // Conversion: anonymous visitors who later became authenticated (same visitor_id)
    const conversionRow = await sql`
      SELECT COUNT(DISTINCT visitor_id)::int AS converted
      FROM page_views
      WHERE user_id IS NOT NULL
        AND visitor_id IN (
          SELECT DISTINCT visitor_id FROM page_views WHERE user_id IS NULL
        )
    `;

    return Response.json({
      general: {
        totalViews: totalViewsRow[0]?.total ?? 0,
        uniqueVisitors: uniqueVisitorsRow[0]?.total ?? 0,
        uniqueUsers: uniqueUsersRow[0]?.total ?? 0,
        viewsToday: viewsTodayRow[0]?.total ?? 0,
        viewsYesterday: viewsYesterdayRow[0]?.total ?? 0,
        viewsThisWeek: viewsThisWeekRow[0]?.total ?? 0,
        viewsThisMonth: viewsThisMonthRow[0]?.total ?? 0,
        dailyViews,
        topPages,
        hourlyToday,
      },
      segmented: {
        overview: segmentOverall,
        topPagesAuth,
        topPagesAnon,
        converted: conversionRow[0]?.converted ?? 0,
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
