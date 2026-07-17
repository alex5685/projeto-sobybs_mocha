import sql from '@/app/api/utils/sql';

export async function GET() {
  const rows =
    await sql`SELECT setting_key, setting_value FROM system_settings WHERE category = 'contatos'`;
  const contacts: Record<string, string> = {};
  rows.forEach((r: { setting_key: string; setting_value: string }) => {
    contacts[r.setting_key] = r.setting_value;
  });
  return Response.json({ contacts });
}
