import sql from '@/app/api/utils/sql';

export async function GET() {
  try {
    const rows = await sql`
      SELECT setting_key, setting_value
      FROM system_settings
      WHERE category = 'planos_consultoria'
      ORDER BY setting_key
    `;

    const prices: Record<string, number> = {
      bronze: 500,
      silver: 1800,
      gold: 3000,
    };

    for (const row of rows) {
      if (row.setting_key === 'plan_bronze_price')
        prices.bronze = parseFloat(row.setting_value) || 500;
      if (row.setting_key === 'plan_silver_price')
        prices.silver = parseFloat(row.setting_value) || 1800;
      if (row.setting_key === 'plan_gold_price')
        prices.gold = parseFloat(row.setting_value) || 3000;
    }

    return Response.json({ prices });
  } catch (error) {
    console.error('Error fetching plan prices:', error);
    return Response.json({ prices: { bronze: 500, silver: 1800, gold: 3000 } }, { status: 200 });
  }
}
