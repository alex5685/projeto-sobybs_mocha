import sql from '@/app/api/utils/sql';

export async function GET() {
  const rows =
    await sql`SELECT setting_key, setting_value FROM system_settings WHERE category = 'institucional'`;
  const institutional: Record<string, string> = {};
  rows.forEach((r: { setting_key: string; setting_value: string }) => {
    institutional[r.setting_key] = r.setting_value;
  });
  return Response.json({ institutional });
}
