import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseBRL(v: string | null | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[R$\s.]/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/**
 * Score-based range narrowing:
 * Higher score = narrower range (lower uncertainty), lower score = wider range.
 *
 * Base uncertainty: Gold ±5%, Silver ±10%
 * Score ≥ 85 → base × 0.50 (highly attractive, very tight range)
 * Score ≥ 70 → base × 0.75
 * Score ≥ 55 → base × 1.00 (base uncertainty)
 * Score ≥ 40 → base × 1.35
 * Score <  40 → base × 1.70 (high risk, wide range)
 */
function applyScoreToRange(
  score: number,
  valorEstimado: number,
  planType: string
): { valor_minimo: number; valor_maximo: number; nivel_incerteza_referencia: string } {
  const baseUncertainty = planType === 'gold' ? 0.05 : 0.1;
  let multiplier = 1.0;
  if (score >= 85) multiplier = 0.5;
  else if (score >= 70) multiplier = 0.75;
  else if (score >= 55) multiplier = 1.0;
  else if (score >= 40) multiplier = 1.35;
  else multiplier = 1.7;

  const uncertainty = baseUncertainty * multiplier;
  return {
    valor_minimo: Math.round(valorEstimado * (1 - uncertainty)),
    valor_maximo: Math.round(valorEstimado * (1 + uncertainty)),
    nivel_incerteza_referencia: `±${(uncertainty * 100).toFixed(1)}%`,
  };
}

/** Compute a rough quality score (0–100) from business details for the fallback path */
function computeFallbackScore(details: Record<string, unknown>): number {
  let score = 50; // base

  // Segment premium
  const seg = String(details.segmento || '').toLowerCase();
  if (seg.includes('tecnologia') || seg.includes('saas')) score += 10;
  else if (seg.includes('saúde') || seg.includes('saude')) score += 7;
  else if (seg.includes('industria')) score += 5;

  // Recurring revenue
  const rec = String(details.receita_recorrente || '').toLowerCase();
  if (rec.includes('75') || rec.includes('acima')) score += 12;
  else if (rec.includes('50')) score += 7;
  else if (rec.includes('25')) score += 3;

  // Long-term contracts
  const contracts = String(details.contratos_longo_prazo || '').toLowerCase();
  if (!contracts.includes('não') && contracts.length > 3) score += 6;

  // Owner dependency (negative)
  const dep = String(details.dependencia_proprietario || '').toLowerCase();
  if (dep.includes('indefinidamente') || dep.includes('nenhum')) score -= 10;
  else if (dep.includes('longo prazo')) score -= 5;

  // Growth trend
  const trend = String(details.tendencia_crescimento || '').toLowerCase();
  if (trend.includes('acelerado') || trend.includes('forte')) score += 8;
  else if (trend.includes('moderado') || trend.includes('estável')) score += 3;
  else if (trend.includes('queda')) score -= 8;

  // Debt penalty
  const divImp = parseBRL(details.valor_divida_impostos as string);
  const divPart = parseBRL(details.valor_divida_particular as string);
  const fat = parseBRL(details.faturamento_mensal as string);
  if (fat > 0 && divImp + divPart > fat * 6) score -= 10;
  else if (fat > 0 && divImp + divPart > fat * 3) score -= 5;

  return Math.max(10, Math.min(95, Math.round(score)));
}

function fallbackComplete(details: Record<string, unknown>, planType: string) {
  const fat = parseBRL(details.faturamento_mensal as string);
  const desp = parseBRL(details.despesas_fixas as string);
  const llMensal = parseBRL(details.lucro_liquido_mensal as string) || Math.max(0, fat - desp);
  const ebitda = parseBRL(details.ebitda as string) || llMensal;
  const lucroAnual = llMensal * 12;

  const seg = String(details.segmento || '').toLowerCase();
  let mBase = 3;
  if (seg.includes('tecnologia') || seg.includes('saas')) mBase = 5;
  else if (seg.includes('saúde') || seg.includes('saude')) mBase = 4;
  else if (seg.includes('industria')) mBase = 4;

  if (details.receita_recorrente && String(details.receita_recorrente).includes('75')) mBase += 0.5;
  if (details.contratos_longo_prazo && !String(details.contratos_longo_prazo).includes('Não'))
    mBase += 0.3;
  if (
    details.dependencia_proprietario &&
    String(details.dependencia_proprietario).includes('indefinidamente')
  )
    mBase += 0.3;

  const ebitdaAnual = ebitda * 12;
  const valorEstimado = Math.round(lucroAnual * mBase);

  // Compute score dynamically
  const score = computeFallbackScore(details);
  const { valor_minimo, valor_maximo, nivel_incerteza_referencia } = applyScoreToRange(
    score,
    valorEstimado,
    planType
  );

  return {
    valor_estimado: valorEstimado,
    valor_minimo,
    valor_maximo,
    nivel_incerteza_referencia,
    score_atratividade: score,
    analise_mercado: `Análise baseada em benchmarks do setor ${details.segmento || 'geral'} no Brasil.`,
    pontos_fortes: ['Empresa estabelecida', 'Operação ativa'],
    metodologias: [
      {
        nome: 'Múltiplo SDE (Lucro Ajustado)',
        valor: valorEstimado,
        peso: 0.45,
        descricao: `${mBase}x o lucro anual líquido ajustado`,
      },
      {
        nome: 'Múltiplo de EBITDA',
        valor: Math.round(ebitdaAnual * mBase * 0.9),
        peso: 0.35,
        descricao: `${(mBase * 0.9).toFixed(1)}x o EBITDA anual estimado`,
      },
      {
        nome: 'Múltiplo de Receita',
        valor: Math.round(fat * 12 * 0.5),
        peso: 0.2,
        descricao: `0.5x o faturamento anual bruto`,
      },
    ],
    riscos: [
      {
        categoria: 'Financeiro',
        descricao: 'Concentração de receita em poucos clientes',
        impacto: 'Médio',
        probabilidade: 'Média',
      },
      {
        categoria: 'Operacional',
        descricao: 'Dependência do proprietário na operação',
        impacto: 'Alto',
        probabilidade: 'Alta',
      },
      {
        categoria: 'Mercado',
        descricao: 'Concorrência no setor',
        impacto: 'Médio',
        probabilidade: 'Média',
      },
    ],
    recomendacoes: [
      {
        titulo: 'Reduzir dependência do proprietário',
        prioridade: 'Alta',
        impacto_estimado: '10-20% no valor',
        prazo: '6-12 meses',
        descricao: 'Documentar processos e capacitar equipe de gestão',
      },
      {
        titulo: 'Diversificar base de clientes',
        prioridade: 'Alta',
        impacto_estimado: '8-15% no valor',
        prazo: '3-9 meses',
        descricao: 'Ampliar carteira e reduzir concentração nos maiores clientes',
      },
      {
        titulo: 'Aumentar receitas recorrentes',
        prioridade: 'Média',
        impacto_estimado: '5-12% no valor',
        prazo: '6-18 meses',
        descricao: 'Contratos de manutenção, assinaturas ou retenção',
      },
    ],
    intangiveis:
      planType === 'gold'
        ? {
            valor_marca: Math.round(valorEstimado * 0.1),
            processos: Math.round(valorEstimado * 0.05),
            capital_humano: Math.round(valorEstimado * 0.08),
            total: Math.round(valorEstimado * 0.23),
          }
        : null,
    last_updated: new Date().toISOString(),
    revisions_available: 'Ilimitadas (Silver/Gold)',
  };
}

async function geminiPhase2(details: Record<string, unknown>, planType: string) {
  const fat = parseBRL(details.faturamento_mensal as string);
  const fatLiq = parseBRL(details.faturamento_liquido_mensal as string);
  const lucroBruto = parseBRL(details.lucro_bruto_mensal as string);
  const lucroLiq =
    parseBRL(details.lucro_liquido_mensal as string) ||
    Math.max(0, fat - parseBRL(details.despesas_fixas as string));
  const ebitda = parseBRL(details.ebitda as string);
  const impostos = parseBRL(details.impostos_mensais as string);
  const valorMarca = parseBRL(details.valor_marca as string);
  const divImp = parseBRL(details.valor_divida_impostos as string);
  const divPart = parseBRL(details.valor_divida_particular as string);
  const divTotal = divImp + divPart;
  const valorImoveis = parseBRL(details.valor_imoveis as string);
  const valorFrota = parseBRL(details.valor_frota as string);

  const isGold = planType === 'gold';

  const prompt = `Você é um especialista sênior em M&A, valuation e fusões e aquisições de empresas brasileiras, com profundo conhecimento do mercado nacional.

== DADOS COMPLETOS DA EMPRESA ==

OPERACIONAL:
- Segmento: ${details.segmento || 'Não informado'}
- Ramo de atividade: ${details.ramo_atividade || 'Não informado'}
- Tempo de atuação: ${details.tempo_atuacao || 'Não informado'}
- Nº de funcionários: ${details.num_funcionarios || 'Não informado'}
- Localização: ${details.cidade || 'Brasil'}, ${details.pais || 'Brasil'}
- Nº de clientes ativos: ${details.num_clientes_ativos || 'Não informado'}
- Descrição do negócio: ${details.descricao_negocio || 'Não informado'}
- Diferencial competitivo: ${details.diferencial_competitivo || 'Não informado'}

FINANCEIRO (Mensal):
- Faturamento bruto: R$ ${fat.toLocaleString('pt-BR')}
${fatLiq > 0 ? `- Faturamento líquido: R$ ${fatLiq.toLocaleString('pt-BR')}` : ''}
- Despesas fixas: R$ ${parseBRL(details.despesas_fixas as string).toLocaleString('pt-BR')}
${lucroBruto > 0 ? `- Lucro bruto: R$ ${lucroBruto.toLocaleString('pt-BR')}` : ''}
- Lucro líquido estimado: R$ ${lucroLiq.toLocaleString('pt-BR')}
${ebitda > 0 ? `- EBITDA mensal: R$ ${ebitda.toLocaleString('pt-BR')}` : ''}
${impostos > 0 ? `- Impostos mensais: R$ ${impostos.toLocaleString('pt-BR')}` : ''}

ATIVOS:
${valorImoveis > 0 ? `- Imóveis: R$ ${valorImoveis.toLocaleString('pt-BR')} (${details.qtd_imoveis || '?'} imóvel(is))` : '- Imóveis: Não possui'}
${valorFrota > 0 ? `- Frota: R$ ${valorFrota.toLocaleString('pt-BR')} (${details.tipo_frota || ''} - ${details.qtd_veiculos || '?'} veículos)` : '- Frota: Não possui'}
${valorMarca > 0 ? `- Valor estimado da marca: R$ ${valorMarca.toLocaleString('pt-BR')}` : ''}
${details.investimentos_andamento ? `- Investimentos em andamento: ${details.investimentos_andamento}` : ''}

DÍVIDAS:
- Total de dívidas: R$ ${divTotal.toLocaleString('pt-BR')}
${divImp > 0 ? `  - Fiscais/Tributárias: R$ ${divImp.toLocaleString('pt-BR')}` : ''}
${divPart > 0 ? `  - Financeiras/Particulares: R$ ${divPart.toLocaleString('pt-BR')}` : ''}

QUALIDADE DO NEGÓCIO:
- Receita recorrente: ${details.receita_recorrente || 'Não informado'}
- Concentração dos 3 maiores clientes: ${details.concentracao_clientes || 'Não informado'}
- Tendência de crescimento (12 meses): ${details.tendencia_crescimento || 'Não informado'}
- Contratos de longo prazo: ${details.contratos_longo_prazo || 'Não informado'}
- Dependência do proprietário: ${details.dependencia_proprietario || 'Não informado'}
- Potencial de crescimento: ${details.potencial_crescimento || 'Não informado'}
- Utiliza mídia/marketing: ${details.utiliza_midia ? 'Sim' : 'Não'}${details.tipos_midia ? ` (${details.tipos_midia})` : ''}
- Motivação para venda: ${details.motivacao_venda || 'Não informado'}

== TAREFA ==
Pesquise benchmarks de mercado atuais para empresas do segmento "${details.segmento || details.ramo_atividade}" no Brasil (2024-2025) e execute um valuation completo e profissional com as seguintes metodologias:
1. Múltiplo SDE (Seller's Discretionary Earnings) — mais relevante para PMEs brasileiras
2. Múltiplo de EBITDA — se dados disponíveis
3. Múltiplo de Receita — referência setorial
${isGold ? '4. Análise de Intangíveis — marca, processos, capital humano\n5. DCF simplificado — se há dados suficientes' : ''}

IMPORTANTE: 
- O valor FINAL deve descontar as dívidas totais (R$ ${divTotal.toLocaleString('pt-BR')}).
- Ajuste o score de atratividade (0-100) com base em todos os fatores.
- O plano é ${planType.toUpperCase()} — incerteza de ±${planType === 'gold' ? '5' : '10'}%.

Retorne SOMENTE um JSON válido e completo:
{
  "valor_estimado": <number - valor central pós-dívidas>,
  "valor_minimo": <number - valor mínimo ±${planType === 'gold' ? '5' : '10'}%>,
  "valor_maximo": <number - valor máximo ±${planType === 'gold' ? '5' : '10'}%>,
  "nivel_incerteza_referencia": "±${planType === 'gold' ? '5' : '10'}%",
  "score_atratividade": <number 0-100>,
  "analise_mercado": "<2-4 frases sobre mercado atual, múltiplos e comparáveis do setor no Brasil>",
  "pontos_fortes": ["<ponto 1>", "<ponto 2>", "<ponto 3>"],
  "metodologias": [
    {"nome": "Múltiplo SDE", "valor": <number>, "peso": 0.45, "descricao": "<ex: 3.2x o SDE anual de R$ X>"},
    {"nome": "Múltiplo EBITDA", "valor": <number>, "peso": 0.35, "descricao": "<ex: 4x EBITDA anual>"},
    {"nome": "Múltiplo de Receita", "valor": <number>, "peso": 0.2, "descricao": "<ex: 0.6x faturamento anual>"}${isGold ? `,\n    {"nome": "DCF Simplificado", "valor": <number>, "peso": 0, "descricao": "<premissas e resultado>"}` : ''}
  ],
  "riscos": [
    {"categoria": "<Financeiro|Operacional|Mercado|Jurídico>", "descricao": "<risco específico>", "impacto": "<Alto|Médio|Baixo>", "probabilidade": "<Alta|Média|Baixa>"}
  ],
  "recomendacoes": [
    {"titulo": "<ação concreta>", "prioridade": "<Alta|Média|Baixa>", "impacto_estimado": "<% ou R$ esperado>", "prazo": "<ex: 3-6 meses>", "descricao": "<como implementar>"}
  ]${
    isGold
      ? `,
  "intangiveis": {
    "valor_marca": <number - valor estimado da marca>,
    "processos": <number - valor dos processos documentados>,
    "capital_humano": <number - valor do capital humano>,
    "total": <number - soma dos intangíveis>
  }`
      : ''
  }
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!res.ok) {
    console.error('Gemini Phase2 HTTP error:', res.status);
    return null;
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  if (!parsed.valor_estimado) return null;

  return {
    valor_estimado: Number(parsed.valor_estimado),
    valor_minimo: Number(parsed.valor_minimo),
    valor_maximo: Number(parsed.valor_maximo),
    nivel_incerteza_referencia: String(
      parsed.nivel_incerteza_referencia || `±${planType === 'gold' ? '5' : '10'}%`
    ),
    score_atratividade: Number(parsed.score_atratividade || 70),
    analise_mercado: String(parsed.analise_mercado || ''),
    pontos_fortes: (parsed.pontos_fortes as string[]) || [],
    metodologias: ((parsed.metodologias as Array<Record<string, unknown>>) || []).map((m) => ({
      nome: String(m.nome || ''),
      valor: Number(m.valor || 0),
      peso: Number(m.peso || 0),
      descricao: String(m.descricao || ''),
    })),
    riscos: ((parsed.riscos as Array<Record<string, unknown>>) || []).map((r) => ({
      categoria: String(r.categoria || ''),
      descricao: String(r.descricao || ''),
      impacto: String(r.impacto || 'Médio'),
      probabilidade: String(r.probabilidade || 'Média'),
    })),
    recomendacoes: ((parsed.recomendacoes as Array<Record<string, unknown>>) || []).map((r) => ({
      titulo: String(r.titulo || ''),
      prioridade: String(r.prioridade || 'Média'),
      impacto_estimado: String(r.impacto_estimado || ''),
      prazo: String(r.prazo || ''),
      descricao: String(r.descricao || ''),
    })),
    intangiveis:
      isGold && parsed.intangiveis
        ? {
            valor_marca: Number((parsed.intangiveis as Record<string, unknown>).valor_marca || 0),
            processos: Number((parsed.intangiveis as Record<string, unknown>).processos || 0),
            capital_humano: Number(
              (parsed.intangiveis as Record<string, unknown>).capital_humano || 0
            ),
            total: Number((parsed.intangiveis as Record<string, unknown>).total || 0),
          }
        : null,
    last_updated: new Date().toISOString(),
    revisions_available: 'Ilimitadas (Silver/Gold)',
  };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  // Verifica acesso à empresa
  const [business] = await sql`SELECT owner_id FROM businesses WHERE id = ${id}`;
  if (!business) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
  if (business.owner_id !== user.id) {
    const [p] = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
    if (p?.user_type !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // Gate: apenas Silver ou Gold
  const [sub] = await sql`
    SELECT subscription_level FROM user_profiles
    WHERE id = ${user.id}
      AND subscription_level IN ('silver', 'gold')
  `;
  if (!sub) {
    return Response.json(
      {
        error: 'Esta funcionalidade está disponível apenas nos planos Silver e Gold',
        upgrade_required: true,
        plan_required: 'silver',
      },
      { status: 403 }
    );
  }

  const planType = String(sub.subscription_level);

  // Se já existe valuation gerado, retorna (exceto se for forçada revisão)
  const forceNew = new URL(req.url).searchParams.get('refresh') === '1';
  if (!forceNew) {
    const [existing] = await sql`
      SELECT * FROM valuations WHERE business_id = ${id} AND type = 'complete' ORDER BY created_at DESC LIMIT 1
    `;
    if (existing) {
      const val = existing as {
        valuation_data: Record<string, unknown>;
        revisions_count: number;
        id: string;
      };
      return Response.json({
        valuation: { ...val.valuation_data, revisions_count: val.revisions_count, id: val.id },
      });
    }
  }

  // Carrega todos os dados da empresa
  const [details] = await sql`SELECT * FROM business_details WHERE business_id = ${id}`;
  if (!details || !details.faturamento_mensal) {
    return Response.json({ error: 'Dados financeiros da empresa incompletos' }, { status: 400 });
  }

  const bd = details as Record<string, unknown>;

  // Fase 2: IA com RAG completo
  let valuationData = fallbackComplete(bd, planType);
  if (process.env.GEMINI_API_KEY) {
    try {
      const aiResult = await geminiPhase2(bd, planType);
      if (aiResult) valuationData = aiResult;
    } catch (err) {
      console.error('Gemini Phase2 error:', err);
    }
  }

  // Always override min/max/incerteza using score-based range (ensures consistency)
  const scoreRange = applyScoreToRange(
    valuationData.score_atratividade,
    valuationData.valor_estimado,
    planType
  );
  valuationData = { ...valuationData, ...scoreRange };

  // Persiste
  const valuationId = crypto.randomUUID();
  await sql`
    INSERT INTO valuations (id, business_id, type, valuation_data, revisions_count)
    VALUES (${valuationId}, ${id}, 'complete', ${JSON.stringify(valuationData)}, 0)
  `;

  return Response.json({ valuation: { ...valuationData, id: valuationId, revisions_count: 0 } });
}
