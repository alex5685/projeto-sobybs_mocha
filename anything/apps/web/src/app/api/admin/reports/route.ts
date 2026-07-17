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

function fmtR(val: number) {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  const parts = (d.split('T')[0] ?? d).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
}

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function wrapHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:28px 36px}
h1{font-size:20px;font-weight:700;color:#00A9E0}
h2{font-size:14px;font-weight:700;color:#1a1a1a;margin:22px 0 8px;border-bottom:2px solid #00A9E0;padding-bottom:3px}
h3{font-size:12px;font-weight:700;color:#333;margin:12px 0 5px}
.hdr{display:flex;justify-content:space-between;margin-bottom:18px;padding-bottom:12px;border-bottom:3px solid #00A9E0}
.logo{font-size:20px;font-weight:900;color:#00A9E0}
.meta{text-align:right;color:#555;font-size:11px}
.meta strong{display:block;font-size:13px;color:#111;margin-bottom:2px}
.kpis{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}
.kpi{background:#f7f9fc;border:1px solid #e0e7ef;border-radius:6px;padding:10px 14px;min-width:110px}
.kpi .val{font-size:17px;font-weight:800;color:#00A9E0}
.kpi .lbl{font-size:10px;color:#666;margin-top:2px}
table{width:100%;border-collapse:collapse;margin-top:6px;font-size:11px}
thead th{background:#00A9E0;color:#fff;padding:6px 8px;text-align:left;font-weight:700}
tbody tr:nth-child(even){background:#f7f9fc}
tbody td{padding:5px 8px;border-bottom:1px solid #edf0f5}
.pos{color:#059669;font-weight:700}
.neg{color:#dc2626;font-weight:700}
.ft{margin-top:28px;padding-top:8px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center}
.badge{display:inline-block;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:700}
.g{background:#d1fae5;color:#065f46}.r{background:#fee2e2;color:#991b1b}
.b{background:#dbeafe;color:#1e40af}.a{background:#fef3c7;color:#92400e}
.bar{height:6px;background:#e5e7eb;border-radius:3px}
.barfill{height:100%;background:#00A9E0;border-radius:3px}
</style>
</head>
<body>
<div class="hdr">
  <div><div class="logo">Sobybs</div><div style="color:#555;font-size:11px;margin-top:2px">Plataforma de M&amp;A</div></div>
  <div class="meta"><strong>${title}</strong>Gerado em: ${today()}</div>
</div>
${body}
<div class="ft">Relatório gerado automaticamente &mdash; Painel Admin Sobybs &mdash; ${today()}</div>
</body></html>`;
}

// ─── Financeiro ───────────────────────────────────────────────────────────────
async function buildFinanceiroHtml() {
  const currentMonth = currentYearMonth();

  const dreRows = await sql`
    SELECT entry_type, category, COALESCE(SUM(amount),0)::numeric AS total
    FROM financial_entries WHERE reference_month = ${currentMonth}
    GROUP BY entry_type, category`;

  const monthlySummary = await sql`
    SELECT reference_month, entry_type, COALESCE(SUM(amount),0)::numeric AS total
    FROM financial_entries WHERE entry_date >= NOW() - INTERVAL '6 months'
    GROUP BY reference_month, entry_type ORDER BY reference_month ASC`;

  const topClients = await sql`
    SELECT u.name, u.email,
      COALESCE(SUM(CASE WHEN fe.entry_type='receita' THEN fe.amount ELSE 0 END),0)::numeric AS total_receita
    FROM financial_entries fe LEFT JOIN "user" u ON u.id = fe.client_user_id
    WHERE fe.client_user_id IS NOT NULL
    GROUP BY u.name, u.email ORDER BY total_receita DESC LIMIT 20`;

  const recentEntries = await sql`
    SELECT fe.entry_date, fe.entry_type, fe.category, fe.description, fe.amount, u.name AS client_name
    FROM financial_entries fe LEFT JOIN "user" u ON u.id = fe.client_user_id
    ORDER BY fe.entry_date DESC LIMIT 50`;

  const dreArr = dreRows as Array<{ entry_type: string; category: string; total: string }>;
  const receita = dreArr
    .filter((r) => r.entry_type === 'receita')
    .reduce((a, r) => a + Number(r.total), 0);
  const despesa = dreArr
    .filter((r) => r.entry_type === 'despesa')
    .reduce((a, r) => a + Number(r.total), 0);
  const margem = receita - despesa;
  const margemPct = receita > 0 ? ((margem / receita) * 100).toFixed(1) : '0.0';

  const monthMap: Record<string, { receita: number; despesa: number }> = {};
  for (const r of monthlySummary as Array<{
    reference_month: string;
    entry_type: string;
    total: string;
  }>) {
    if (!monthMap[r.reference_month]) monthMap[r.reference_month] = { receita: 0, despesa: 0 };
    if (r.entry_type === 'receita') monthMap[r.reference_month].receita += Number(r.total);
    if (r.entry_type === 'despesa') monthMap[r.reference_month].despesa += Number(r.total);
  }
  const monthRows =
    Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([m, v]) =>
          `<tr><td>${m}</td><td class="pos">${fmtR(v.receita)}</td><td class="neg">${fmtR(v.despesa)}</td><td class="${v.receita - v.despesa >= 0 ? 'pos' : 'neg'}">${fmtR(v.receita - v.despesa)}</td></tr>`
      )
      .join('') || '<tr><td colspan="4" style="text-align:center;color:#999">Sem dados</td></tr>';

  const clientRows =
    (topClients as Array<{ name: string; email: string; total_receita: string }>)
      .map(
        (c, i) =>
          `<tr><td><b>#${i + 1}</b></td><td>${c.name ?? '—'}</td><td style="color:#666">${c.email ?? ''}</td><td class="pos">${fmtR(Number(c.total_receita))}</td></tr>`
      )
      .join('') ||
    '<tr><td colspan="4" style="text-align:center;color:#999">Nenhum cliente vinculado</td></tr>';

  const entryRows =
    (
      recentEntries as Array<{
        entry_date: string;
        entry_type: string;
        category: string;
        description: string;
        amount: string;
        client_name: string | null;
      }>
    )
      .map(
        (e) =>
          `<tr><td>${fmtDate(e.entry_date)}</td><td><span class="badge ${e.entry_type === 'receita' ? 'g' : 'r'}">${e.entry_type}</span></td><td>${e.category}</td><td>${e.description}</td><td>${e.client_name ?? '—'}</td><td class="${e.entry_type === 'receita' ? 'pos' : 'neg'}">${e.entry_type === 'receita' ? '+' : '−'} ${fmtR(Number(e.amount))}</td></tr>`
      )
      .join('') ||
    '<tr><td colspan="6" style="text-align:center;color:#999">Sem lançamentos</td></tr>';

  return wrapHtml(
    'Relatório Financeiro',
    `
<div class="kpis">
  <div class="kpi"><div class="val">${fmtR(receita)}</div><div class="lbl">Receita (${currentMonth})</div></div>
  <div class="kpi"><div class="val">${fmtR(despesa)}</div><div class="lbl">Despesas (${currentMonth})</div></div>
  <div class="kpi"><div class="val" style="color:${margem >= 0 ? '#059669' : '#dc2626'}">${fmtR(margem)}</div><div class="lbl">Margem Líquida — ${margemPct}%</div></div>
</div>
<h2>Evolução Mensal (6 meses)</h2>
<table><thead><tr><th>Mês</th><th>Receita</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>${monthRows}</tbody></table>
<h2>Top 20 Clientes por Receita</h2>
<table><thead><tr><th>#</th><th>Cliente</th><th>E-mail</th><th>Total Receita</th></tr></thead><tbody>${clientRows}</tbody></table>
<h2>Últimos 50 Lançamentos</h2>
<table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Cliente</th><th>Valor</th></tr></thead><tbody>${entryRows}</tbody></table>`
  );
}

// ─── Funil ────────────────────────────────────────────────────────────────────
async function buildFunilHtml() {
  const stages = await sql`
    SELECT status_workflow AS stage, COUNT(*)::int AS count
    FROM businesses GROUP BY status_workflow ORDER BY count DESC`;

  const usersByType = await sql`
    SELECT user_type, COUNT(*)::int AS count FROM user_profiles GROUP BY user_type`;

  const totalRow = await sql`SELECT COUNT(*)::int AS total FROM businesses`;

  const stagesArr = stages as Array<{ stage: string; count: number }>;
  const totalBiz = Number((totalRow[0] as { total: number })?.total ?? 0);
  const fechados = stagesArr.find((s) => s.stage === 'fechado')?.count ?? 0;
  const convGlobal = totalBiz > 0 ? ((fechados / totalBiz) * 100).toFixed(1) : '0.0';
  const LABELS: Record<string, string> = {
    cadastro: 'Cadastro',
    analise: 'Em Análise',
    publicado: 'Publicadas',
    negociacao: 'Em Negociação',
    fechado: 'Fechados',
  };
  const maxCount = Math.max(...stagesArr.map((s) => s.count), 1);

  const stageRows =
    stagesArr
      .map((s) => {
        const pct = totalBiz > 0 ? ((s.count / totalBiz) * 100).toFixed(1) : '0';
        const barPct = ((s.count / maxCount) * 100).toFixed(0);
        return `<tr><td>${LABELS[s.stage] ?? s.stage}</td><td style="font-weight:700">${s.count}</td><td>${pct}%</td><td style="min-width:100px"><div class="bar"><div class="barfill" style="width:${barPct}%"></div></div></td></tr>`;
      })
      .join('') || '<tr><td colspan="4" style="text-align:center;color:#999">Sem dados</td></tr>';

  const userRows =
    (usersByType as Array<{ user_type: string; count: number }>)
      .map(
        (u) =>
          `<tr><td style="text-transform:capitalize">${u.user_type}</td><td style="font-weight:700">${u.count}</td></tr>`
      )
      .join('') || '<tr><td colspan="2" style="text-align:center;color:#999">Sem dados</td></tr>';

  return wrapHtml(
    'Relatório de Funil de Conversão',
    `
<div class="kpis">
  <div class="kpi"><div class="val">${totalBiz}</div><div class="lbl">Total de Empresas</div></div>
  <div class="kpi"><div class="val">${fechados}</div><div class="lbl">Vendas Fechadas</div></div>
  <div class="kpi"><div class="val">${convGlobal}%</div><div class="lbl">Taxa de Conversão Global</div></div>
</div>
<h2>Empresas por Estágio do Funil</h2>
<table><thead><tr><th>Estágio</th><th>Empresas</th><th>% do Total</th><th>Progresso</th></tr></thead><tbody>${stageRows}</tbody></table>
<h2>Perfil de Usuários</h2>
<table><thead><tr><th>Tipo</th><th>Quantidade</th></tr></thead><tbody>${userRows}</tbody></table>`
  );
}

// ─── Assinaturas ──────────────────────────────────────────────────────────────
async function buildAssinaturasHtml() {
  // Note: column is starts_at (not started_at) per the subscriptions table
  const subs = await sql`
    SELECT s.id, s.plan_type, s.status, s.monthly_value,
           s.starts_at, s.expires_at, s.cancelled_at,
           u.name AS user_name, u.email AS user_email
    FROM subscriptions s LEFT JOIN "user" u ON u.id = s.user_id
    ORDER BY s.starts_at DESC`;

  const summary = await sql`
    SELECT plan_type, status, COUNT(*)::int AS count,
           COALESCE(SUM(monthly_value),0)::numeric AS mrr
    FROM subscriptions GROUP BY plan_type, status ORDER BY plan_type, status`;

  const subsArr = subs as Array<{
    plan_type: string;
    status: string;
    monthly_value: string;
    starts_at: string;
    expires_at: string | null;
    cancelled_at: string | null;
    user_name: string;
    user_email: string;
  }>;
  const summaryArr = summary as Array<{
    plan_type: string;
    status: string;
    count: number;
    mrr: string;
  }>;

  const active = subsArr.filter((s) => s.status === 'active');
  const totalMrr = active.reduce((a, s) => a + Number(s.monthly_value), 0);
  const STATUS: Record<string, string> = {
    active: 'Ativo',
    cancelled: 'Cancelado',
    expired: 'Expirado',
  };
  const EMOJIS: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
  const SCLS: Record<string, string> = { active: 'g', cancelled: 'r', expired: 'a' };

  const summaryRows =
    summaryArr
      .map(
        (s) =>
          `<tr><td>${EMOJIS[s.plan_type] ?? ''} ${s.plan_type}</td><td><span class="badge ${SCLS[s.status] ?? 'b'}">${STATUS[s.status] ?? s.status}</span></td><td>${s.count}</td><td>${fmtR(Number(s.mrr))}</td></tr>`
      )
      .join('') ||
    '<tr><td colspan="4" style="text-align:center;color:#999">Sem assinaturas</td></tr>';

  const subRows =
    subsArr
      .slice(0, 100)
      .map(
        (s) =>
          `<tr><td>${s.user_name ?? '—'}</td><td style="font-size:10px;color:#666">${s.user_email}</td><td>${EMOJIS[s.plan_type] ?? ''} ${s.plan_type}</td><td><span class="badge ${SCLS[s.status] ?? 'b'}">${STATUS[s.status] ?? s.status}</span></td><td>${fmtR(Number(s.monthly_value))}</td><td>${fmtDate(s.starts_at)}</td><td>${fmtDate(s.expires_at)}</td></tr>`
      )
      .join('') ||
    '<tr><td colspan="7" style="text-align:center;color:#999">Sem assinaturas</td></tr>';

  return wrapHtml(
    'Relatório de Assinaturas',
    `
<div class="kpis">
  <div class="kpi"><div class="val">${active.length}</div><div class="lbl">Assinaturas Ativas</div></div>
  <div class="kpi"><div class="val">${fmtR(totalMrr)}</div><div class="lbl">MRR Total</div></div>
  <div class="kpi"><div class="val">${subsArr.filter((s) => s.status === 'cancelled').length}</div><div class="lbl">Canceladas</div></div>
  <div class="kpi"><div class="val">${subsArr.length}</div><div class="lbl">Total Geral</div></div>
</div>
<h2>Resumo por Plano e Status</h2>
<table><thead><tr><th>Plano</th><th>Status</th><th>Qtd</th><th>Valor/mês</th></tr></thead><tbody>${summaryRows}</tbody></table>
<h2>Listagem de Assinaturas</h2>
<table><thead><tr><th>Usuário</th><th>E-mail</th><th>Plano</th><th>Status</th><th>Valor/mês</th><th>Início</th><th>Expira</th></tr></thead><tbody>${subRows}</tbody></table>`
  );
}

// ─── Planos e Serviços ────────────────────────────────────────────────────────
async function buildPlanosHtml() {
  const services =
    await sql`SELECT plan_name, service_description, display_order FROM plan_services WHERE is_active = 1 ORDER BY plan_name, display_order`;
  const compRows =
    await sql`SELECT section, row_type, label, bronze_value, silver_value, gold_value FROM comparison_rows WHERE is_active = 1 ORDER BY section, display_order`;
  const faqs =
    await sql`SELECT question, answer FROM faqs WHERE is_active = 1 ORDER BY display_order`;

  const servicesArr = services as Array<{ plan_name: string; service_description: string }>;
  const compArr = compRows as Array<{
    section: string;
    row_type: string;
    label: string;
    bronze_value: string;
    silver_value: string;
    gold_value: string;
  }>;
  const faqsArr = faqs as Array<{ question: string; answer: string }>;

  const byPlan: Record<string, string[]> = { bronze: [], silver: [], gold: [] };
  for (const s of servicesArr) {
    const k = s.plan_name.toLowerCase();
    if (byPlan[k]) byPlan[k].push(s.service_description);
  }

  const planBlocks = ['bronze', 'silver', 'gold']
    .map((p) => {
      const emoji = ({ bronze: '🥉', silver: '🥈', gold: '🥇' } as Record<string, string>)[p] ?? '';
      const rows =
        (byPlan[p] ?? []).map((i) => `<tr><td>✓ ${i}</td></tr>`).join('') ||
        '<tr><td style="color:#999">Nenhum serviço</td></tr>';
      return `<h3>${emoji} Plano ${p.charAt(0).toUpperCase() + p.slice(1)}</h3><table><tbody>${rows}</tbody></table>`;
    })
    .join('');

  const compSection = (sec: string, label: string) => {
    const rows =
      compArr
        .filter((r) => r.section === sec)
        .map(
          (r) =>
            `<tr><td>${r.label}</td><td style="text-align:center">${r.bronze_value || '—'}</td><td style="text-align:center">${r.silver_value || '—'}</td><td style="text-align:center">${r.gold_value || '—'}</td></tr>`
        )
        .join('') || '<tr><td colspan="4" style="text-align:center;color:#999">Sem dados</td></tr>';
    return `<h2>${label}</h2><table><thead><tr><th>Serviço</th><th style="text-align:center">🥉 Bronze</th><th style="text-align:center">🥈 Silver</th><th style="text-align:center">🥇 Gold</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  const faqContent =
    faqsArr.length > 0
      ? faqsArr
          .map(
            (f, i) =>
              `<h3>${i + 1}. ${f.question}</h3><p style="color:#444;margin-bottom:10px;padding-left:10px">${f.answer}</p>`
          )
          .join('')
      : '<p style="color:#999">Nenhuma FAQ cadastrada</p>';

  return wrapHtml(
    'Relatório de Planos e Serviços',
    `
<h2>Serviços por Plano</h2>${planBlocks}
${compSection('geral', 'Comparação — Serviços Gerais')}
${compSection('certidoes', 'Comparação — Due Diligence &amp; Documentação')}
<h2>FAQ — Perguntas Frequentes</h2>${faqContent}`
  );
}

// ─── Consolidado ──────────────────────────────────────────────────────────────
async function buildConsolidadoHtml() {
  const currentMonth = currentYearMonth();

  const dreRows =
    await sql`SELECT entry_type, COALESCE(SUM(amount),0)::numeric AS total FROM financial_entries WHERE reference_month = ${currentMonth} GROUP BY entry_type`;
  const stageRows =
    await sql`SELECT status_workflow AS stage, COUNT(*)::int AS count FROM businesses GROUP BY status_workflow`;
  const activeSubRow =
    await sql`SELECT COUNT(*)::int AS count, COALESCE(SUM(monthly_value),0)::numeric AS mrr FROM subscriptions WHERE status = 'active'`;

  const dreArr = dreRows as Array<{ entry_type: string; total: string }>;
  const receitaVal = Number(dreArr.find((r) => r.entry_type === 'receita')?.total ?? 0);
  const despesaVal = Number(dreArr.find((r) => r.entry_type === 'despesa')?.total ?? 0);
  const totalBiz = (stageRows as Array<{ count: number }>).reduce((a, r) => a + r.count, 0);
  const fechados =
    (stageRows as Array<{ stage: string; count: number }>).find((r) => r.stage === 'fechado')
      ?.count ?? 0;
  const activeSub = activeSubRow[0] as { count: number; mrr: string } | undefined;

  const kpis = `<div class="kpis">
  <div class="kpi"><div class="val">${fmtR(receitaVal)}</div><div class="lbl">Receita (mês atual)</div></div>
  <div class="kpi"><div class="val">${fmtR(despesaVal)}</div><div class="lbl">Despesas (mês atual)</div></div>
  <div class="kpi"><div class="val" style="color:${receitaVal - despesaVal >= 0 ? '#059669' : '#dc2626'}">${fmtR(receitaVal - despesaVal)}</div><div class="lbl">Margem Líquida</div></div>
  <div class="kpi"><div class="val">${totalBiz}</div><div class="lbl">Total Empresas</div></div>
  <div class="kpi"><div class="val">${fechados}</div><div class="lbl">Vendas Fechadas</div></div>
  <div class="kpi"><div class="val">${activeSub?.count ?? 0}</div><div class="lbl">Assin. Ativas · ${fmtR(Number(activeSub?.mrr ?? 0))}/mês</div></div>
</div>`;

  const strip = (html: string) =>
    html
      .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '')
      .replace(/<\/body>[\s\S]*$/, '')
      .replace(/<div class="ft">[\s\S]*?<\/div>/, '');

  const finHtml = await buildFinanceiroHtml();
  const funHtml = await buildFunilHtml();
  const subHtml = await buildAssinaturasHtml();

  return wrapHtml(
    'Relatório Consolidado',
    `
${kpis}
<h2 style="font-size:16px;margin-top:24px;color:#00A9E0">Seção 1 — Financeiro</h2>
${strip(finHtml)}
<h2 style="font-size:16px;margin-top:24px;color:#7C3AED">Seção 2 — Funil de Conversão</h2>
${strip(funHtml)}
<h2 style="font-size:16px;margin-top:24px;color:#0369A1">Seção 3 — Assinaturas</h2>
${strip(subHtml)}`
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? 'financeiro';

  const BUILDERS: Record<string, () => Promise<string>> = {
    financeiro: buildFinanceiroHtml,
    funil: buildFunilHtml,
    assinaturas: buildAssinaturasHtml,
    planos: buildPlanosHtml,
    consolidado: buildConsolidadoHtml,
  };

  const builder = BUILDERS[type];
  if (!builder) return Response.json({ error: 'Tipo de relatório inválido' }, { status: 400 });

  try {
    const html = await builder();

    const pdfRes = await fetch(
      `${process.env.NEXT_PUBLIC_CREATE_BASE_URL}/integrations/pdf-generation/pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ANYTHING_PROJECT_TOKEN}`,
        },
        body: JSON.stringify({ source: { html } }),
      }
    );

    if (!pdfRes.ok) {
      const errText = await pdfRes.text();
      console.error('PDF gen error:', pdfRes.status, errText.slice(0, 300));
      return Response.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
    }

    const pdfBuffer = await pdfRes.arrayBuffer();
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-${type}-${dateStr}.pdf"`,
      },
    });
  } catch (error) {
    console.error(`Error generating ${type} report:`, error);
    return Response.json({ error: 'Erro interno ao gerar relatório' }, { status: 500 });
  }
}
