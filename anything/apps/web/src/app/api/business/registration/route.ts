import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/app/api/utils/sql';

interface BusinessBody {
  business_id?: string; // ADD: if provided, update this business; if not, create new
  alias_name?: string;
  ramo_atividade?: string;
  segmento?: string;
  tempo_atuacao?: string;
  faturamento_mensal?: string;
  despesas_fixas?: string;
  num_funcionarios?: string;
  possui_imoveis?: boolean;
  qtd_imoveis?: string;
  valor_imoveis?: string;
  possui_frota?: boolean;
  tipo_frota?: string;
  qtd_veiculos?: string;
  valor_frota?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  utiliza_midia?: boolean;
  tipos_midia?: string[];
  divida_impostos?: boolean;
  valor_divida_impostos?: string;
  divida_particular?: boolean;
  valor_divida_particular?: string;
  valuation_vendedor?: string;
  motivacao_venda?: string;
  capital_aquisicao?: string;
  prazo_maximo?: string;
  objetivos_compra?: string;
  experiencia_empreendedor?: string;
  dedicacao_tempo?: string;
  receita_recorrente?: string;
  concentracao_clientes?: string;
  tendencia_crescimento?: string;
  contratos_longo_prazo?: string;
  dependencia_proprietario?: string;
  faturamento_liquido_mensal?: string;
  lucro_bruto_mensal?: string;
  lucro_liquido_mensal?: string;
  impostos_mensais?: string;
  ebitda?: string;
  investimentos_andamento?: string;
  num_clientes_ativos?: string;
  valor_marca?: string;
  potencial_crescimento?: string;
  descricao_negocio?: string;
  diferencial_competitivo?: string;
  is_public?: boolean;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const body = (await req.json()) as BusinessBody;

  // Phase-2 financial fields require Silver/Gold subscription
  const phase2Fields: (keyof BusinessBody)[] = [
    'faturamento_liquido_mensal',
    'lucro_bruto_mensal',
    'lucro_liquido_mensal',
    'impostos_mensais',
    'ebitda',
    'investimentos_andamento',
    'num_clientes_ativos',
    'valor_marca',
    'potencial_crescimento',
    'descricao_negocio',
    'diferencial_competitivo',
  ];

  const hasPhase2Data = phase2Fields.some((f) => body[f]);
  if (hasPhase2Data) {
    const profile = await sql`SELECT subscription_level FROM user_profiles WHERE id = ${user.id}`;
    const level = profile[0]?.subscription_level as string | undefined;
    if (!level || !['silver', 'gold'].includes(level)) {
      return Response.json(
        { error: 'Dados financeiros detalhados requerem plano Silver ou Gold' },
        { status: 403 }
      );
    }
  }

  // ── FIX: determine if this is a create or update ──────────────────────────
  // If body.business_id is provided, update that specific business.
  // Otherwise, always create a new one — never pick "any existing" by owner_id.
  let businessId: string | undefined = body.business_id;

  if (businessId) {
    // Verify the user owns this business (or is admin)
    const owned = await sql`SELECT id, owner_id FROM businesses WHERE id = ${businessId}`;
    if (!owned[0]) return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    if (owned[0].owner_id !== user.id) {
      const profile = await sql`SELECT user_type FROM user_profiles WHERE id = ${user.id}`;
      if (profile[0]?.user_type !== 'admin') {
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }
    // Update the businesses row
    await sql`
      UPDATE businesses
      SET alias_name = COALESCE(${body.alias_name ?? null}, alias_name),
          sector     = COALESCE(${body.segmento ?? null}, sector),
          city       = COALESCE(${body.cidade ?? null}, city),
          is_public  = ${body.is_public ? 1 : 0},
          updated_at = NOW()
      WHERE id = ${businessId}
    `;
  } else {
    // Create a brand-new business record
    businessId = crypto.randomUUID();
    await sql`
      INSERT INTO businesses (id, owner_id, alias_name, sector, city, status_workflow, is_public)
      VALUES (
        ${businessId},
        ${user.id},
        ${body.alias_name ?? 'Minha Empresa'},
        ${body.segmento ?? null},
        ${body.cidade ?? null},
        'cadastro',
        ${body.is_public ? 1 : 0}
      )
    `;
  }

  // Check if business_details record exists for this specific businessId
  const detailsExist = await sql`SELECT id FROM business_details WHERE business_id = ${businessId}`;
  const tiposMidiaJson = body.tipos_midia ? JSON.stringify(body.tipos_midia) : null;

  if (detailsExist.length === 0) {
    const detailId = crypto.randomUUID();
    await sql`
      INSERT INTO business_details (
        id, "userId", business_id,
        ramo_atividade, segmento, tempo_atuacao, faturamento_mensal, despesas_fixas, num_funcionarios,
        possui_imoveis, qtd_imoveis, valor_imoveis,
        possui_frota, tipo_frota, qtd_veiculos, valor_frota,
        cep, rua, numero, complemento, bairro, cidade, estado, pais,
        utiliza_midia, tipos_midia,
        divida_impostos, valor_divida_impostos,
        divida_particular, valor_divida_particular,
        valuation_vendedor, motivacao_venda,
        capital_aquisicao, prazo_maximo, objetivos_compra,
        experiencia_empreendedor, dedicacao_tempo,
        receita_recorrente, concentracao_clientes, tendencia_crescimento,
        contratos_longo_prazo, dependencia_proprietario,
        faturamento_liquido_mensal, lucro_bruto_mensal, lucro_liquido_mensal,
        impostos_mensais, ebitda, investimentos_andamento,
        num_clientes_ativos, valor_marca, potencial_crescimento,
        descricao_negocio, diferencial_competitivo
      ) VALUES (
        ${detailId}, ${user.id}, ${businessId},
        ${body.ramo_atividade ?? null}, ${body.segmento ?? null}, ${body.tempo_atuacao ?? null},
        ${body.faturamento_mensal ?? null}, ${body.despesas_fixas ?? null}, ${body.num_funcionarios ?? null},
        ${body.possui_imoveis ? 1 : 0}, ${body.qtd_imoveis ?? null}, ${body.valor_imoveis ?? null},
        ${body.possui_frota ? 1 : 0}, ${body.tipo_frota ?? null}, ${body.qtd_veiculos ?? null}, ${body.valor_frota ?? null},
        ${body.cep ?? null}, ${body.rua ?? null}, ${body.numero ?? null}, ${body.complemento ?? null},
        ${body.bairro ?? null}, ${body.cidade ?? null}, ${body.estado ?? null}, ${body.pais ?? 'Brasil'},
        ${body.utiliza_midia ? 1 : 0}, ${tiposMidiaJson},
        ${body.divida_impostos ? 1 : 0}, ${body.valor_divida_impostos ?? null},
        ${body.divida_particular ? 1 : 0}, ${body.valor_divida_particular ?? null},
        ${body.valuation_vendedor ?? null}, ${body.motivacao_venda ?? null},
        ${body.capital_aquisicao ?? null}, ${body.prazo_maximo ?? null}, ${body.objetivos_compra ?? null},
        ${body.experiencia_empreendedor ?? null}, ${body.dedicacao_tempo ?? null},
        ${body.receita_recorrente ?? null}, ${body.concentracao_clientes ?? null}, ${body.tendencia_crescimento ?? null},
        ${body.contratos_longo_prazo ?? null}, ${body.dependencia_proprietario ?? null},
        ${body.faturamento_liquido_mensal ?? null}, ${body.lucro_bruto_mensal ?? null}, ${body.lucro_liquido_mensal ?? null},
        ${body.impostos_mensais ?? null}, ${body.ebitda ?? null}, ${body.investimentos_andamento ?? null},
        ${body.num_clientes_ativos ?? null}, ${body.valor_marca ?? null}, ${body.potencial_crescimento ?? null},
        ${body.descricao_negocio ?? null}, ${body.diferencial_competitivo ?? null}
      )
    `;
  } else {
    // Dynamic UPDATE — only set provided fields
    const textFields: [string, string | null][] = [
      ['ramo_atividade', body.ramo_atividade ?? null],
      ['segmento', body.segmento ?? null],
      ['tempo_atuacao', body.tempo_atuacao ?? null],
      ['faturamento_mensal', body.faturamento_mensal ?? null],
      ['despesas_fixas', body.despesas_fixas ?? null],
      ['num_funcionarios', body.num_funcionarios ?? null],
      ['qtd_imoveis', body.qtd_imoveis ?? null],
      ['valor_imoveis', body.valor_imoveis ?? null],
      ['tipo_frota', body.tipo_frota ?? null],
      ['qtd_veiculos', body.qtd_veiculos ?? null],
      ['valor_frota', body.valor_frota ?? null],
      ['cep', body.cep ?? null],
      ['rua', body.rua ?? null],
      ['numero', body.numero ?? null],
      ['complemento', body.complemento ?? null],
      ['bairro', body.bairro ?? null],
      ['cidade', body.cidade ?? null],
      ['estado', body.estado ?? null],
      ['pais', body.pais ?? null],
      ['tipos_midia', tiposMidiaJson],
      ['valor_divida_impostos', body.valor_divida_impostos ?? null],
      ['valor_divida_particular', body.valor_divida_particular ?? null],
      ['valuation_vendedor', body.valuation_vendedor ?? null],
      ['motivacao_venda', body.motivacao_venda ?? null],
      ['capital_aquisicao', body.capital_aquisicao ?? null],
      ['prazo_maximo', body.prazo_maximo ?? null],
      ['objetivos_compra', body.objetivos_compra ?? null],
      ['experiencia_empreendedor', body.experiencia_empreendedor ?? null],
      ['dedicacao_tempo', body.dedicacao_tempo ?? null],
      ['receita_recorrente', body.receita_recorrente ?? null],
      ['concentracao_clientes', body.concentracao_clientes ?? null],
      ['tendencia_crescimento', body.tendencia_crescimento ?? null],
      ['contratos_longo_prazo', body.contratos_longo_prazo ?? null],
      ['dependencia_proprietario', body.dependencia_proprietario ?? null],
      ['faturamento_liquido_mensal', body.faturamento_liquido_mensal ?? null],
      ['lucro_bruto_mensal', body.lucro_bruto_mensal ?? null],
      ['lucro_liquido_mensal', body.lucro_liquido_mensal ?? null],
      ['impostos_mensais', body.impostos_mensais ?? null],
      ['ebitda', body.ebitda ?? null],
      ['investimentos_andamento', body.investimentos_andamento ?? null],
      ['num_clientes_ativos', body.num_clientes_ativos ?? null],
      ['valor_marca', body.valor_marca ?? null],
      ['potencial_crescimento', body.potencial_crescimento ?? null],
      ['descricao_negocio', body.descricao_negocio ?? null],
      ['diferencial_competitivo', body.diferencial_competitivo ?? null],
    ];
    const boolFields: [string, number][] = [
      ['possui_imoveis', body.possui_imoveis ? 1 : 0],
      ['possui_frota', body.possui_frota ? 1 : 0],
      ['utiliza_midia', body.utiliza_midia ? 1 : 0],
      ['divida_impostos', body.divida_impostos ? 1 : 0],
      ['divida_particular', body.divida_particular ? 1 : 0],
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const [col, val] of textFields) {
      if (val !== null) {
        setClauses.push(`${col} = $${i++}`);
        values.push(val);
      }
    }
    for (const [col, val] of boolFields) {
      setClauses.push(`${col} = $${i++}`);
      values.push(val);
    }

    if (setClauses.length > 0) {
      values.push(businessId);
      await sql(
        `UPDATE business_details SET ${setClauses.join(', ')}, "updatedAt" = NOW() WHERE business_id = $${i}`,
        values
      );
    }
  }

  return Response.json({ businessId });
}
