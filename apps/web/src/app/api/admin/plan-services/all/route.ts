import sql from '@/app/api/utils/sql';

export async function GET() {
  const rows =
    await sql`SELECT * FROM plan_services WHERE is_active = 1 ORDER BY plan_name, display_order ASC`;
  const services: Record<string, unknown[]> = { bronze: [], silver: [], gold: [] };
  rows.forEach((r: { plan_name: string }) => {
    if (services[r.plan_name]) services[r.plan_name].push(r);
  });
  return Response.json({ services });
}
