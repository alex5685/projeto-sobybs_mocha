import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const rows = await sql`SELECT user_type FROM user_profiles WHERE id = ${session.user.id}`;
  if (!rows[0] || rows[0].user_type !== 'admin') return null;
  return session;
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const url = new URL(req.url);
  const startDate = url.searchParams.get('start_date') ?? '';
  const endDate = url.searchParams.get('end_date') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const entryType = url.searchParams.get('entry_type') ?? '';
  const search = url.searchParams.get('search') ?? '';
  const referenceMonth = url.searchParams.get('reference_month') ?? '';
  const clientUserId = url.searchParams.get('client_user_id') ?? '';
  const businessId = url.searchParams.get('business_id') ?? '';

  try {
    // Build WHERE clauses dynamically
    const conditions: string[] = ['1=1'];
    const values: (string | number)[] = [];
    let idx = 1;

    if (startDate) {
      conditions.push(`fe.entry_date >= $${idx++}::date`);
      values.push(startDate);
    }
    if (endDate) {
      conditions.push(`fe.entry_date <= $${idx++}::date`);
      values.push(endDate);
    }
    if (category) {
      conditions.push(`fe.category = $${idx++}`);
      values.push(category);
    }
    if (entryType) {
      conditions.push(`fe.entry_type = $${idx++}`);
      values.push(entryType);
    }
    if (referenceMonth) {
      conditions.push(`fe.reference_month = $${idx++}`);
      values.push(referenceMonth);
    }
    if (clientUserId) {
      conditions.push(`fe.client_user_id = $${idx++}`);
      values.push(clientUserId);
    }
    if (businessId) {
      conditions.push(`fe.business_id = $${idx++}`);
      values.push(businessId);
    }
    if (search) {
      conditions.push(
        `(LOWER(fe.description) LIKE LOWER($${idx++}) OR LOWER(u.name) LIKE LOWER($${idx++}) OR LOWER(u.email) LIKE LOWER($${idx++}))`
      );
      const like = `%${search}%`;
      values.push(like, like, like);
      idx += 2;
    }

    const where = conditions.join(' AND ');

    const entriesQuery = `
      SELECT
        fe.id, fe.entry_date, fe.entry_type, fe.category, fe.description,
        fe.amount, fe.reference_month, fe.notes, fe.created_at,
        u.name as client_name, u.email as client_email,
        b.alias_name as business_name
      FROM financial_entries fe
      LEFT JOIN "user" u ON u.id = fe.client_user_id
      LEFT JOIN businesses b ON b.id = fe.business_id
      WHERE ${where}
      ORDER BY fe.entry_date DESC, fe.created_at DESC
      LIMIT 200
    `;

    const entries = await sql(entriesQuery, values);

    // DRE summary for current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dreFilter = referenceMonth || currentMonth;

    const dreRows = await sql`
      SELECT
        entry_type,
        category,
        COALESCE(SUM(amount), 0)::numeric as total
      FROM financial_entries
      WHERE reference_month = ${dreFilter}
      GROUP BY entry_type, category
    `;

    const dreReceita = dreRows
      .filter((r: { entry_type: string }) => r.entry_type === 'receita')
      .reduce((acc: number, r: { total: string | number }) => acc + Number(r.total), 0);
    const dreDespesa = dreRows
      .filter((r: { entry_type: string }) => r.entry_type === 'despesa')
      .reduce((acc: number, r: { total: string | number }) => acc + Number(r.total), 0);

    const dreByCategory = dreRows.reduce(
      (
        acc: Record<string, { receita: number; despesa: number }>,
        r: { category: string; entry_type: string; total: string | number }
      ) => {
        if (!acc[r.category]) acc[r.category] = { receita: 0, despesa: 0 };
        acc[r.category][r.entry_type as 'receita' | 'despesa'] += Number(r.total);
        return acc;
      },
      {}
    );

    // Monthly summary for chart
    const monthlySummary = await sql`
      SELECT
        reference_month,
        entry_type,
        COALESCE(SUM(amount), 0)::numeric as total
      FROM financial_entries
      WHERE entry_date >= NOW() - INTERVAL '12 months'
      GROUP BY reference_month, entry_type
      ORDER BY reference_month ASC
    `;

    // Available months for filter
    const availableMonths = await sql`
      SELECT DISTINCT reference_month FROM financial_entries
      WHERE reference_month IS NOT NULL AND reference_month != ''
      ORDER BY reference_month DESC LIMIT 24
    `;

    return Response.json({
      entries,
      dre: {
        month: dreFilter,
        receita: dreReceita,
        despesa: dreDespesa,
        margem: dreReceita - dreDespesa,
        margemPct:
          dreReceita > 0 ? (((dreReceita - dreDespesa) / dreReceita) * 100).toFixed(1) : '0.0',
        byCategory: dreByCategory,
      },
      monthlySummary,
      availableMonths: availableMonths.map((r: { reference_month: string }) => r.reference_month),
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return Response.json({ error: 'Erro ao buscar dados financeiros' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const body = (await req.json()) as {
      entry_date: string;
      entry_type: string;
      category: string;
      description: string;
      amount: number;
      reference_month?: string;
      notes?: string;
      client_user_id?: string;
      business_id?: string;
    };

    const {
      entry_date,
      entry_type,
      category,
      description,
      amount,
      reference_month,
      notes,
      client_user_id,
      business_id,
    } = body;

    // Auto-derive reference_month from entry_date if not provided
    const refMonth = reference_month ?? entry_date?.slice(0, 7) ?? '';

    const rows = await sql`
      INSERT INTO financial_entries
        (id, entry_date, entry_type, category, description, amount, reference_month, notes, client_user_id, business_id)
      VALUES
        (gen_random_uuid()::text, ${entry_date}::date, ${entry_type}, ${category}, ${description}, ${amount}, ${refMonth}, ${notes ?? null}, ${client_user_id ?? null}, ${business_id ?? null})
      RETURNING *
    `;
    return Response.json({ entry: rows[0] });
  } catch (error) {
    console.error('Error creating financial entry:', error);
    return Response.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}
