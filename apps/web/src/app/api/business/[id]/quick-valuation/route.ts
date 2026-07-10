import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseBRL(value: string | null | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function fallbackCalc(details: Record<string, string | null | undefined>) {
  const faturamento = parseBRL(details.faturamento_mensal);
  const despesas = parseBRL(details.despesas_fixas);
  const lucroMensal = Math.max(0, faturamento - despesas);
  const lucroAnual = lucroMensal * 12;

  const seg = (details.segmento || '').toLowerCase();
  let mMin = 2,
    mMax = 4;
  if (seg.includes('tecnologia') || seg.includes('saas')) {
    mMin = 4;
    mMax = 8;
  } else if (seg.includes('saúde') || seg.includes('saude')) {
    mMin = 3;
    mMax = 6;
  } else if (seg.includes('varejo') || seg.includes('comércio') || seg.includes('comercio')) {
    mMin = 1.5;
    mMax = 3;
  } else if (seg.includes('industria') || seg.includes('indústria')) {
    mMin = 3;
    mMax = 5;
  }

  return {
    valor_minimo: Math.round(lucroAnual * mMin),
    valor_maximo: Math.round(lucroAnual * mMax),
    multiplo_min: mMin,
    multiplo_max: mMax,
    metodo: 'Múltiplo de Lucro (SDE)',
    contexto_mercado: `Estimativa baseada em múltiplos históricos para o segmento ${details.segmento || 'geral'} no Brasil.`,
    benchmarks: `Múltiplos de ${mMin}x a ${mMax}x o lucro anual são típicos para empresas de ${details.segmento || 'serviços'} no mercado brasileiro.`,
    lucro_liquido_mensal_estimado: Math.round(lucroMensal),
    lucro_liquido_anual_estimado: Math.round(lucroAnual),
    ativos_incluidos: 'Operação, carteira de clientes, marca e processos',
  };
}

async function geminiPhase1(details: Record<string, string | null | undefined>) {
  const faturamento = parseBRL(details.faturamento_mensal);
  const despesas = parseBRL(details.despesas_fixas);
  const lucroEstimado = Math.max(0, faturamento - despesas);

  const prompt = `Você é um especialista sênior em M&A (fusões e aquisições) e valuation de pequenas e médias empresas brasileiras.

DADOS DA EMPRESA:
- Segmento: ${details.segmento || 'Não informado'}
- Ramo de atividade: ${details.ramo_atividade || 'Não informado'}
- Cidade/Localização: ${details.cidade || 'Brasil'}, ${details.pais || 'Brasil'}
- Tempo de atuação: ${details.tempo_atuacao || 'Não informado'}
- Faturamento bruto mensal: R$ ${faturamento.toLocaleString('pt-BR')}
- Despesas fixas mensais: R$ ${despesas.toLocaleString('pt-BR')}
- Lucro operacional estimado: R$ ${lucroEstimado.toLocaleString('pt-BR')}/mês
- Número de funcionários: ${details.num_funcionarios || 'Não informado'}
- Possui imóveis próprios: ${details.possui_imoveis === '1' || details.possui_imoveis === 'true' ? 'Sim' : 'Não'}
- Possui frota de veículos: ${details.possui_frota === '1' || details.possui_frota === 'true' ? 'Sim' : 'Não'}

TAREFA:
1. Pesquise os múltiplos de mercado atuais para empresas de ${details.segmento || details.ramo_atividade || 'serviços'} no Brasil.
2. Identifique benchmarks de transações comparáveis no mercado brasileiro de M&A.
3. Calcule uma faixa de valor de mercado realista para esta empresa.

INSTRUÇÕES:
- Use dados de mercado reais e recentes do Brasil (2023-2025).
- Considere: múltiplos de SDE (Seller's Discretionary Earnings), EBITDA e receita típicos do setor.
- Ajuste pelo porte (pequena empresa), tempo de atuação e localização.
- O valor deve refletir o que um comprador pagaria hoje no mercado brasileiro.

Retorne SOMENTE um JSON válido, sem texto extra:
{
  "valor_minimo": <number em reais>,
  "valor_maximo": <number em reais>,
  "multiplo_min": <number - múltiplo mínimo do lucro anual>,
  "multiplo_max": <number - múltiplo máximo do lucro anual>,
  "metodo": "<metodologia principal usada>",
  "contexto_mercado": "<2-3 frases sobre o mercado atual para este segmento no Brasil>",
  "benchmarks": "<dados reais de múltiplos e comparáveis do setor>",
  "lucro_liquido_mensal_estimado": <number>,
  "lucro_liquido_anual_estimado": <number>,
  "ativos_incluidos": "<o que está sendo valorado>"
}`;

  // Add 25-second timeout to prevent serverless function hang
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response (may have markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    if (!parsed.valor_minimo || !parsed.valor_maximo) return null;

    return {
      valor_minimo: Number(parsed.valor_minimo),
      valor_maximo: Number(parsed.valor_maximo),
      multiplo_min: Number(parsed.multiplo_min) || 2,
      multiplo_max: Number(parsed.multiplo_max) || 4,
      metodo: String(parsed.metodo || 'Múltiplos de Mercado'),
      contexto_mercado: String(parsed.contexto_mercado || ''),
      benchmarks: String(parsed.benchmarks || ''),
      lucro_liquido_mensal_estimado:
        Number(parsed.lucro_liquido_mensal_estimado) ||
        parseBRL(details.faturamento_mensal) - parseBRL(details.despesas_fixas),
      lucro_liquido_anual_estimado:
        Number(parsed.lucro_liquido_anual_estimado) ||
        (parseBRL(details.faturamento_mensal) - parseBRL(details.despesas_fixas)) * 12,
      ativos_incluidos: String(parsed.ativos_incluidos || 'Operação, clientes, marca e processos'),
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── GET – retorna valuation existente ──────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows =
      await sql`SELECT * FROM quick_valuations WHERE business_id = ${id} ORDER BY "createdAt" DESC LIMIT 1`;
    return Response.json({ valuation: rows[0] ?? null });
  } catch (err) {
    console.error('GET quick-valuation error:', err);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ─── POST – gera valuation (fase 1 - gratuita para vendedor/hibrido/admin) ──

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    // Apenas vendedor, hibrido ou admin
    const [profile] = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (!profile || !['vendedor', 'hibrido', 'admin'].includes(profile.user_type)) {
      return Response.json(
        { error: 'Apenas vendedores podem gerar valuation', upgrade_required: true },
        { status: 403 }
      );
    }

    const [business] = await sql`SELECT owner_id FROM businesses WHERE id = ${id}`;
    if (!business) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    if (business.owner_id !== user.id && profile.user_type !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Se já existe, retorna o existente
    const [existing] =
      await sql`SELECT * FROM quick_valuations WHERE business_id = ${id} ORDER BY created_at DESC LIMIT 1`;
    if (existing) return Response.json({ valuation: existing });

    // Requer dados básicos
    const [details] = await sql`SELECT * FROM business_details WHERE business_id = ${id}`;
    if (!details || !details.faturamento_mensal) {
      return Response.json(
        {
          error: 'Preencha faturamento e despesas da empresa antes de gerar o valuation',
          incomplete_data: true,
        },
        { status: 400 }
      );
    }

    const bd = details as Record<string, string | null | undefined>;

    // Fase 1: tenta IA com pesquisa de mercado, senão usa cálculo local
    let result = fallbackCalc(bd);
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiResult = await geminiPhase1(bd);
        if (aiResult) result = aiResult;
      } catch (err) {
        console.error('Gemini Phase1 error:', err);
      }
    }

    const newId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [newValuation] = await sql`
      INSERT INTO quick_valuations (
        id, "userId", business_id,
        valor_minimo, valor_maximo, multiplo_min, multiplo_max,
        metodo, segmento, lucro_liquido_mensal_estimado, lucro_liquido_anual_estimado,
        ativos_incluidos, ai_response, expires_at
      ) VALUES (
        ${newId}, ${user.id}, ${id},
        ${result.valor_minimo}, ${result.valor_maximo},
        ${result.multiplo_min}, ${result.multiplo_max},
        ${result.metodo}, ${bd.segmento ?? null},
        ${result.lucro_liquido_mensal_estimado}, ${result.lucro_liquido_anual_estimado},
        ${result.ativos_incluidos},
        ${JSON.stringify({ contexto_mercado: result.contexto_mercado, benchmarks: result.benchmarks })},
        ${expiresAt}
      ) RETURNING *
    `;

    return Response.json({ valuation: newValuation });
  } catch (err) {
    console.error('POST quick-valuation error:', err);
    return Response.json({ error: 'Erro interno ao gerar valuation' }, { status: 500 });
  }
}
