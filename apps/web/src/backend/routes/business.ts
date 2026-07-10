import { Hono } from "hono";
import { authMiddleware } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import type { Env } from "@/shared/types";
import OpenAI from "openai";

const app = new Hono<{ Bindings: Env }>();

// Helper function to call DeepSeek for AI-enhanced quick valuation
async function generateQuickAIValuation(businessData: any, apiKey: string) {
  const deepseek = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: apiKey,
  });

  const prompt = `Você é um especialista em valuation de empresas brasileiras. Analise os seguintes dados e forneça uma avaliação rápida.

Dados da Empresa:
- Ramo de Atividade: ${businessData.ramo_atividade || "Não informado"}
- Segmento: ${businessData.segmento || "Não informado"}
- Tempo de Mercado: ${businessData.tempo_atuacao || "Não informado"}
- Faturamento Mensal: R$ ${businessData.faturamento_mensal || 0}
- Despesas Fixas: R$ ${businessData.despesas_fixas || 0}
- Número de Funcionários: ${businessData.num_funcionarios || "Não informado"}

Forneça uma estimativa de valor da empresa considerando múltiplos do setor brasileiro.

Retorne APENAS um JSON válido no seguinte formato:
{
  "valor_minimo": 100000,
  "valor_maximo": 250000,
  "multiplo_min": 2.0,
  "multiplo_max": 3.5
}`;

  try {
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return null;
  }
}

// Helper function to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper function to parse currency values (formatted or ranges)
function parseValueRange(rangeStr: string | null | undefined): number {
  if (!rangeStr) return 0;
  
  const str = String(rangeStr).trim();
  
  // Parse range format: "R$ 100.000 a R$ 250.000" or similar
  const rangeMatches = str.match(/R?\$?\s*([\d.,]+)\s*(?:a|até|-)\s*R?\$?\s*([\d.,]+)/i);
  
  if (rangeMatches) {
    const min = parseFloat(rangeMatches[1].replace(/\./g, '').replace(',', '.'));
    const max = parseFloat(rangeMatches[2].replace(/\./g, '').replace(',', '.'));
    
    if (!isNaN(min) && !isNaN(max)) {
      return (min + max) / 2; // Return midpoint
    }
  }
  
  // Parse single formatted currency: "R$ 250.000,00" (Brazilian format)
  // In Brazilian format: dots are thousands separators, comma is decimal separator
  const currencyMatch = str.match(/R?\$?\s*([\d.,]+)/);
  if (currencyMatch) {
    // Remove R$ and spaces, then handle Brazilian number format
    const numStr = currencyMatch[1];
    // If it has both . and ,, it's Brazilian format (1.000.000,00)
    // Remove dots (thousands separator) and replace comma with dot (decimal separator)
    const normalized = numStr.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  // Try to extract a single value
  const singleMatch = str.match(/R?\$?\s*([\d.,]+)/i);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1].replace(/\./g, '').replace(',', '.'));
    return isNaN(value) ? 0 : value;
  }
  
  return 0;
}

// POST /api/business/registration - Save business registration data
app.post("/registration", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const userId = user.id;
  const body = await c.req.json();

  let {
    ramo_atividade,
    segmento,
    tempo_atuacao,
    faturamento_mensal,
    despesas_fixas,
    num_funcionarios,
    possui_imoveis,
    qtd_imoveis,
    valor_imoveis,
    possui_frota,
    tipo_frota,
    qtd_veiculos,
    valor_frota,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    pais,
    utiliza_midia,
    tipos_midia,
    divida_impostos,
    valor_divida_impostos,
    divida_particular,
    valor_divida_particular,
    valuation_vendedor,
    motivacao_venda,
    capital_aquisicao,
    prazo_maximo,
    objetivos_compra,
    experiencia_empreendedor,
    dedicacao_tempo,
    receita_recorrente,
    concentracao_clientes,
    tendencia_crescimento,
    contratos_longo_prazo,
    dependencia_proprietario,
  } = body;

  // Convert tipos_midia array to string
  const tipos_midia_str = Array.isArray(tipos_midia) ? tipos_midia.join(',') : (tipos_midia || null);

  // Check if user has active subscription for premium fields
  const premiumFieldsProvided = 
    receita_recorrente || 
    concentracao_clientes || 
    tendencia_crescimento || 
    contratos_longo_prazo || 
    dependencia_proprietario;

  let hasActivePlan = false;
  
  if (premiumFieldsProvided) {
    const subscription = await c.env.DB.prepare(
      `SELECT id FROM subscriptions 
       WHERE user_id = ? 
       AND status = 'active' 
       AND plan_type IN ('bronze', 'silver', 'gold')`
    )
      .bind(userId)
      .first();
    
    if (!subscription) {
      return c.json({ 
        error: "Disponível apenas para assinantes Bronze/Silver/Gold." 
      }, 403);
    }
    
    hasActivePlan = true;
  }

  try {
    // Check if user already has a business registered
    const existingBusiness = await c.env.DB.prepare(
      `SELECT id FROM businesses WHERE owner_id = ?`
    )
      .bind(userId)
      .first();

    let businessId: string;

    if (existingBusiness) {
      // Update existing business
      businessId = existingBusiness.id as string;
      
      await c.env.DB.prepare(
        `UPDATE businesses 
         SET alias_name = ?,
             sector = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
        .bind(
          ramo_atividade || "Empresa",
          segmento || "Geral",
          businessId
        )
        .run();
    } else {
      // Create new business record
      businessId = generateUUID();
      
      await c.env.DB.prepare(
        `INSERT INTO businesses (id, owner_id, alias_name, sector, status_workflow, is_public)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          businessId,
          userId,
          ramo_atividade || "Empresa",
          segmento || "Geral",
          "cadastro",
          0
        )
        .run();
    }

    // Check if business_details exists
    const existingDetails = await c.env.DB.prepare(
      `SELECT id FROM business_details WHERE business_id = ?`
    )
      .bind(businessId)
      .first();

    if (existingDetails) {
      // Update existing details
      await c.env.DB.prepare(
        `UPDATE business_details 
         SET user_id = ?,
             ramo_atividade = ?,
             segmento = ?,
             tempo_atuacao = ?,
             faturamento_mensal = ?,
             despesas_fixas = ?,
             num_funcionarios = ?,
             possui_imoveis = ?,
             qtd_imoveis = ?,
             valor_imoveis = ?,
             possui_frota = ?,
             tipo_frota = ?,
             qtd_veiculos = ?,
             valor_frota = ?,
             cep = ?,
             rua = ?,
             numero = ?,
             complemento = ?,
             bairro = ?,
             cidade = ?,
             pais = ?,
             utiliza_midia = ?,
             tipos_midia = ?,
             divida_impostos = ?,
             valor_divida_impostos = ?,
             divida_particular = ?,
             valor_divida_particular = ?,
             valuation_vendedor = ?,
             motivacao_venda = ?,
             capital_aquisicao = ?,
             prazo_maximo = ?,
             objetivos_compra = ?,
             experiencia_empreendedor = ?,
             dedicacao_tempo = ?,
             receita_recorrente = ?,
             concentracao_clientes = ?,
             tendencia_crescimento = ?,
             contratos_longo_prazo = ?,
             dependencia_proprietario = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE business_id = ?`
      )
        .bind(
          userId,
          ramo_atividade || null,
          segmento || null,
          tempo_atuacao || null,
          faturamento_mensal || null,
          despesas_fixas || null,
          num_funcionarios || null,
          possui_imoveis ? 1 : 0,
          qtd_imoveis || null,
          valor_imoveis || null,
          possui_frota ? 1 : 0,
          tipo_frota || null,
          qtd_veiculos || null,
          valor_frota || null,
          cep || null,
          rua || null,
          numero || null,
          complemento || null,
          bairro || null,
          cidade || null,
          pais || null,
          utiliza_midia ? 1 : 0,
          tipos_midia_str,
          divida_impostos ? 1 : 0,
          valor_divida_impostos || null,
          divida_particular ? 1 : 0,
          valor_divida_particular || null,
          valuation_vendedor || null,
          motivacao_venda || null,
          capital_aquisicao || null,
          prazo_maximo || null,
          objetivos_compra || null,
          experiencia_empreendedor || null,
          dedicacao_tempo || null,
          hasActivePlan ? (receita_recorrente || null) : null,
          hasActivePlan ? (concentracao_clientes || null) : null,
          hasActivePlan ? (tendencia_crescimento || null) : null,
          hasActivePlan ? (contratos_longo_prazo || null) : null,
          hasActivePlan ? (dependencia_proprietario || null) : null,
          businessId
        )
        .run();
    } else {
      // Insert new details
      await c.env.DB.prepare(
        `INSERT INTO business_details (
          business_id, user_id, ramo_atividade, segmento, tempo_atuacao, faturamento_mensal,
          despesas_fixas, num_funcionarios, possui_imoveis, qtd_imoveis, valor_imoveis,
          possui_frota, tipo_frota, qtd_veiculos, valor_frota, cep, rua, numero,
          complemento, bairro, cidade, pais, utiliza_midia, tipos_midia,
          divida_impostos, valor_divida_impostos, divida_particular, valor_divida_particular,
          valuation_vendedor, motivacao_venda, capital_aquisicao, prazo_maximo,
          objetivos_compra, experiencia_empreendedor, dedicacao_tempo,
          receita_recorrente, concentracao_clientes, tendencia_crescimento,
          contratos_longo_prazo, dependencia_proprietario
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          businessId,
          userId,
          ramo_atividade || null,
          segmento || null,
          tempo_atuacao || null,
          faturamento_mensal || null,
          despesas_fixas || null,
          num_funcionarios || null,
          possui_imoveis ? 1 : 0,
          qtd_imoveis || null,
          valor_imoveis || null,
          possui_frota ? 1 : 0,
          tipo_frota || null,
          qtd_veiculos || null,
          valor_frota || null,
          cep || null,
          rua || null,
          numero || null,
          complemento || null,
          bairro || null,
          cidade || null,
          pais || null,
          utiliza_midia ? 1 : 0,
          tipos_midia_str,
          divida_impostos ? 1 : 0,
          valor_divida_impostos || null,
          divida_particular ? 1 : 0,
          valor_divida_particular || null,
          valuation_vendedor || null,
          motivacao_venda || null,
          capital_aquisicao || null,
          prazo_maximo || null,
          objetivos_compra || null,
          experiencia_empreendedor || null,
          dedicacao_tempo || null,
          hasActivePlan ? (receita_recorrente || null) : null,
          hasActivePlan ? (concentracao_clientes || null) : null,
          hasActivePlan ? (tendencia_crescimento || null) : null,
          hasActivePlan ? (contratos_longo_prazo || null) : null,
          hasActivePlan ? (dependencia_proprietario || null) : null
        )
        .run();
    }

    return c.json({ success: true, businessId });
  } catch (error) {
    console.error("Error saving business data:", error);
    return c.json({ error: "Erro ao salvar dados da empresa" }, 500);
  }
});

// GET /api/business/marketplace - Get all public businesses available for sale
app.get("/marketplace", async (c) => {
  const { sector, city, search } = c.req.query();

  try {
    let query = `
      SELECT 
        b.id,
        b.alias_name,
        b.sector,
        b.status_workflow,
        b.created_at,
        bd.ramo_atividade,
        bd.segmento,
        bd.tempo_atuacao,
        bd.faturamento_mensal,
        bd.num_funcionarios,
        bd.cidade,
        bd.pais,
        bd.possui_imoveis,
        bd.possui_frota
      FROM businesses b
      LEFT JOIN business_details bd ON b.id = bd.business_id
      WHERE b.is_public = 1
    `;

    const params: any[] = [];

    if (sector) {
      query += ` AND bd.segmento = ?`;
      params.push(sector);
    }

    if (city) {
      query += ` AND bd.cidade LIKE ?`;
      params.push(`%${city}%`);
    }

    if (search) {
      query += ` AND (b.alias_name LIKE ? OR bd.ramo_atividade LIKE ? OR bd.segmento LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = params.length > 0 
      ? await c.env.DB.prepare(query).bind(...params).all()
      : await c.env.DB.prepare(query).all();

    return c.json({ businesses: result.results || [] });
  } catch (error) {
    console.error("Error fetching marketplace businesses:", error);
    return c.json({ error: "Erro ao buscar empresas" }, 500);
  }
});

// GET /api/business/my-businesses - Get all businesses owned by the current user
app.get("/my-businesses", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const userId = user.id;

  try {
    const businesses = await c.env.DB.prepare(
      `SELECT 
        b.id,
        b.alias_name,
        b.sector,
        b.status_workflow,
        b.is_public,
        b.created_at,
        b.updated_at,
        bd.ramo_atividade,
        bd.segmento,
        bd.faturamento_mensal,
        bd.cidade,
        bd.pais
       FROM businesses b
       LEFT JOIN business_details bd ON b.id = bd.business_id
       WHERE b.owner_id = ?
       ORDER BY b.created_at DESC`
    )
      .bind(userId)
      .all();

    return c.json({ businesses: businesses.results || [] });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return c.json({ error: "Erro ao buscar empresas" }, 500);
  }
});

// GET /api/business/:id - Get detailed information about a specific business
app.get("/:id", async (c) => {
  const businessId = c.req.param("id");

  try {
    const business = await c.env.DB.prepare(
      `SELECT 
        b.*,
        bd.*,
        b.id as business_id,
        bd.id as details_id
       FROM businesses b
       LEFT JOIN business_details bd ON b.id = bd.business_id
       WHERE b.id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    const isPublic = business.is_public === 1;

    // If business is not public, check authentication
    if (!isPublic) {
      const user = c.get("user");
      
      if (!user) {
        return c.json({ error: "Sem permissão para visualizar esta empresa" }, 403);
      }

      // Check if user has permission to view
      const profile = await c.env.DB.prepare(
        `SELECT user_type FROM user_profiles WHERE id = ?`
      )
        .bind(user.id)
        .first();

      const isOwner = business.owner_id === user.id;
      const isAdmin = profile?.user_type === "admin";

      // Allow access if: user is owner or admin
      if (!isOwner && !isAdmin) {
        return c.json({ error: "Sem permissão para visualizar esta empresa" }, 403);
      }
    }

    return c.json({ business });
  } catch (error) {
    console.error("Error fetching business:", error);
    return c.json({ error: "Erro ao buscar empresa" }, 500);
  }
});

// PATCH /api/business/:id/publish - Toggle business publication status
app.patch("/:id/publish", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const businessId = c.req.param("id");
  const { is_public } = await c.req.json();

  try {
    // Check if business exists and belongs to user
    const business = await c.env.DB.prepare(
      `SELECT owner_id FROM businesses WHERE id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    if (business.owner_id !== user.id) {
      return c.json({ error: "Sem permissão para editar esta empresa" }, 403);
    }

    // Update publication status
    await c.env.DB.prepare(
      `UPDATE businesses SET is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    )
      .bind(is_public ? 1 : 0, businessId)
      .run();

    return c.json({ success: true, is_public: is_public ? 1 : 0 });
  } catch (error) {
    console.error("Error updating business publication status:", error);
    return c.json({ error: "Erro ao atualizar status de publicação" }, 500);
  }
});

// POST /api/business/valuation - Generate AI valuation for a business
app.post("/valuation", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const userId = user.id;

  try {
    // Fetch business for the user
    const business = await c.env.DB.prepare(
      `SELECT b.id, bd.* 
       FROM businesses b
       LEFT JOIN business_details bd ON b.id = bd.business_id
       WHERE b.owner_id = ?
       LIMIT 1`
    )
      .bind(userId)
      .first();

    if (!business) {
      return c.json({ error: "Dados da empresa não encontrados. Complete o cadastro primeiro." }, 404);
    }

    // Check if API key is configured
    if (!c.env.GEMINI_API_KEY) {
      return c.json({ error: "API key do Gemini não configurada. Configure o secret GEMINI_API_KEY." }, 500);
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY! });

    // Build prompt with business data
    const prompt = `Você é um especialista em valuation (avaliação) de empresas brasileiras. 

Analise os seguintes dados de uma empresa e forneça uma estimativa de valor de mercado:

**Dados da Empresa:**
- Ramo de atividade: ${business.ramo_atividade || "Não informado"}
- Segmento: ${business.segmento || "Não informado"}
- Tempo de atuação: ${business.tempo_atuacao || "Não informado"}
- Faturamento bruto mensal: ${business.faturamento_mensal || "Não informado"}
- Despesas fixas mensais: ${business.despesas_fixas || "Não informado"}
- Número de funcionários: ${business.num_funcionarios || "Não informado"}
- Possui imóveis: ${business.possui_imoveis ? "Sim" : "Não"}
${business.possui_imoveis ? `- Quantidade de imóveis: ${business.qtd_imoveis || "Não informado"}` : ""}
${business.possui_imoveis ? `- Valor dos imóveis: ${business.valor_imoveis || "Não informado"}` : ""}
- Possui frota: ${business.possui_frota ? "Sim" : "Não"}
${business.possui_frota ? `- Tipo de frota: ${business.tipo_frota || "Não informado"}` : ""}
${business.possui_frota ? `- Quantidade de veículos: ${business.qtd_veiculos || "Não informado"}` : ""}
${business.possui_frota ? `- Valor da frota: ${business.valor_frota || "Não informado"}` : ""}
- Localização: ${business.cidade || "Não informado"}, ${business.pais || "Brasil"}
- Utiliza mídia/propaganda: ${business.utiliza_midia ? "Sim" : "Não"}
- Possui dívidas de impostos: ${business.divida_impostos ? "Sim" : "Não"}
${business.divida_impostos ? `- Valor da dívida de impostos: ${business.valor_divida_impostos || "Não informado"}` : ""}
- Possui dívidas particulares: ${business.divida_particular ? "Sim" : "Não"}
${business.divida_particular ? `- Valor da dívida particular: ${business.valor_divida_particular || "Não informado"}` : ""}

**Forneça sua análise no seguinte formato JSON:**
{
  "estimated_value": "Valor estimado em R$ (exemplo: 'R$ 500.000 a R$ 750.000')",
  "valuation_range": "Faixa de valuation (exemplo: 'Baixo', 'Médio', 'Alto')",
  "methodology": "Metodologia usada para o cálculo (máximo 2 frases)",
  "key_factors": ["fator1", "fator2", "fator3"],
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "risks": ["risco 1", "risco 2", "risco 3"],
  "confidence_level": "Nível de confiança (exemplo: 'Moderado', 'Alto', 'Baixo')"
}

**Importante:**
- Use múltiplos de faturamento típicos para o setor brasileiro
- Considere o tempo de atuação e ativos da empresa
- Desconte dívidas do valor final
- Seja conservador na estimativa
- Forneça apenas o JSON, sem texto adicional antes ou depois`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia da IA");
    }

    const valuationData = JSON.parse(responseText);

    return c.json({
      success: true,
      valuation: valuationData,
    });
  } catch (error) {
    console.error("Error generating AI valuation:", error);
    return c.json({ error: "Erro ao gerar valuation com IA. Verifique se a API key do Gemini está configurada." }, 500);
  }
});

// POST /api/business/:id/images - Upload an image for a business
app.post("/:id/images", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const businessId = c.req.param("id");

  try {
    // Check if business exists and user has permission
    const business = await c.env.DB.prepare(
      `SELECT owner_id FROM businesses WHERE id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    // Check if user is owner or admin
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(user.id)
      .first();

    const isOwner = business.owner_id === user.id;
    const isAdmin = profile?.user_type === "admin";

    if (!isOwner && !isAdmin) {
      return c.json({ error: "Sem permissão para adicionar imagens" }, 403);
    }

    // Get form data
    const formData = await c.req.formData();
    const file = formData.get("image") as File;
    const isPrimary = formData.get("is_primary") === "true";

    if (!file) {
      return c.json({ error: "Nenhum arquivo enviado" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return c.json({ error: "Apenas arquivos JPG e PNG são permitidos" }, 400);
    }

    // Check image count limit (max 7 images per business)
    const imageCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM business_images WHERE business_id = ?`
    )
      .bind(businessId)
      .first();

    if ((imageCount?.count as number || 0) >= 7) {
      return c.json({ error: "Limite máximo de 7 fotos atingido" }, 400);
    }

    // Generate storage key
    const imageId = crypto.randomUUID();
    const fileExt = file.name.split(".").pop() || "jpg";
    const storageKey = `business-images/${businessId}/${imageId}.${fileExt}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(storageKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // If this is primary, unset other primary images
    if (isPrimary) {
      await c.env.DB.prepare(
        `UPDATE business_images SET is_primary = 0 WHERE business_id = ?`
      )
        .bind(businessId)
        .run();
    }

    // Get next display order
    const maxOrder = await c.env.DB.prepare(
      `SELECT MAX(display_order) as max_order FROM business_images WHERE business_id = ?`
    )
      .bind(businessId)
      .first();

    const displayOrder = (maxOrder?.max_order as number || 0) + 1;

    // Save to database
    await c.env.DB.prepare(
      `INSERT INTO business_images (id, business_id, storage_key, file_name, is_primary, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(imageId, businessId, storageKey, file.name, isPrimary ? 1 : 0, displayOrder)
      .run();

    return c.json({ 
      success: true, 
      imageId,
      storageKey 
    });
  } catch (error) {
    console.error("Error uploading business image:", error);
    return c.json({ error: "Erro ao fazer upload da imagem" }, 500);
  }
});

// GET /api/business/:id/images - Get all images for a business
app.get("/:id/images", async (c) => {
  const businessId = c.req.param("id");

  try {
    const images = await c.env.DB.prepare(
      `SELECT id, storage_key, file_name, is_primary, display_order, created_at
       FROM business_images
       WHERE business_id = ?
       ORDER BY is_primary DESC, display_order ASC`
    )
      .bind(businessId)
      .all();

    return c.json({ images: images.results || [] });
  } catch (error) {
    console.error("Error fetching business images:", error);
    return c.json({ error: "Erro ao buscar imagens" }, 500);
  }
});

// DELETE /api/business/:businessId/images/:imageId - Delete a business image
app.delete("/:businessId/images/:imageId", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const businessId = c.req.param("businessId");
  const imageId = c.req.param("imageId");

  try {
    // Check if business exists and user has permission
    const business = await c.env.DB.prepare(
      `SELECT owner_id FROM businesses WHERE id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    // Check if user is owner or admin
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(user.id)
      .first();

    const isOwner = business.owner_id === user.id;
    const isAdmin = profile?.user_type === "admin";

    if (!isOwner && !isAdmin) {
      return c.json({ error: "Sem permissão para deletar imagens" }, 403);
    }

    // Get image info
    const image = await c.env.DB.prepare(
      `SELECT storage_key FROM business_images WHERE id = ? AND business_id = ?`
    )
      .bind(imageId, businessId)
      .first();

    if (!image) {
      return c.json({ error: "Imagem não encontrada" }, 404);
    }

    // Delete from R2
    await c.env.R2_BUCKET.delete(image.storage_key as string);

    // Delete from database
    await c.env.DB.prepare(
      `DELETE FROM business_images WHERE id = ?`
    )
      .bind(imageId)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting business image:", error);
    return c.json({ error: "Erro ao deletar imagem" }, 500);
  }
});

// PATCH /api/business/:businessId/images/:imageId/primary - Set image as primary
app.patch("/:businessId/images/:imageId/primary", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const businessId = c.req.param("businessId");
  const imageId = c.req.param("imageId");

  try {
    // Check if business exists and user has permission
    const business = await c.env.DB.prepare(
      `SELECT owner_id FROM businesses WHERE id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    // Check if user is owner or admin
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(user.id)
      .first();

    const isOwner = business.owner_id === user.id;
    const isAdmin = profile?.user_type === "admin";

    if (!isOwner && !isAdmin) {
      return c.json({ error: "Sem permissão para editar imagens" }, 403);
    }

    // Unset all primary images for this business
    await c.env.DB.prepare(
      `UPDATE business_images SET is_primary = 0 WHERE business_id = ?`
    )
      .bind(businessId)
      .run();

    // Set this image as primary
    await c.env.DB.prepare(
      `UPDATE business_images SET is_primary = 1 WHERE id = ? AND business_id = ?`
    )
      .bind(imageId, businessId)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error setting primary image:", error);
    return c.json({ error: "Erro ao definir imagem principal" }, 500);
  }
});

// GET /api/business/:id/quick-valuation - Get the last quick valuation for a business
app.get("/:id/quick-valuation", async (c) => {
  const businessId = String(c.req.param("id"));

  try {
    const valuation = await c.env.DB.prepare(
      `SELECT * FROM quick_valuations WHERE business_id = ? ORDER BY created_at DESC LIMIT 1`
    )
      .bind(businessId)
      .first();

    if (!valuation) {
      return c.json({ error: "Nenhum valuation rápido encontrado para esta empresa" }, 404);
    }

    return c.json({ 
      success: true,
      valuation 
    });
  } catch (error) {
    console.error("Error fetching quick valuation:", error);
    return c.json({ error: "Erro ao buscar valuation rápido" }, 500);
  }
});

// POST /api/business/:id/quick-valuation - Generate quick valuation (free, once per business)
app.post("/:id/quick-valuation", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const businessId = String(c.req.param("id"));

  try {
    // Check if business exists
    const business = await c.env.DB.prepare(
      `SELECT b.*, bd.*
       FROM businesses b
       LEFT JOIN business_details bd ON b.id = bd.business_id
       WHERE b.id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    // Check authorization (must be owner)
    const userId = String(user.id);
    if (business.owner_id !== userId) {
      return c.json({ error: "Apenas o proprietário pode gerar valuation" }, 403);
    }

    // Check if user has required profile (Vendedor, Híbrido, or Admin)
    const profile: any = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(userId)
      .first();

    const userType: string = String(profile?.user_type || "basico");
    const allowedTypes = ["vendedor", "hibrido", "admin"];
    
    if (!allowedTypes.includes(userType as string)) {
      return c.json({ 
        error: "Valuation disponível apenas para perfis Vendedor, Híbrido ou Admin",
        upgrade_required: true 
      }, 403);
    }

    // Check if quick valuation already exists for this business
    const existingValuation = await c.env.DB.prepare(
      `SELECT * FROM quick_valuations WHERE business_id = ? ORDER BY created_at DESC LIMIT 1`
    )
      .bind(businessId)
      .first();

    if (existingValuation) {
      // Return existing valuation
      return c.json({ 
        success: true,
        valuation: existingValuation,
        message: "Retornando valuation rápido existente"
      });
    }

    // Validate required data and parse value ranges
    const faturamento = parseValueRange(business.faturamento_mensal as string);
    const despesas = parseValueRange(business.despesas_fixas as string);

    if (!faturamento || !despesas) {
      return c.json({ 
        error: "Dados financeiros incompletos. Por favor, complete o faturamento bruto mensal e despesas fixas no cadastro da empresa.",
        incomplete_data: true
      }, 400);
    }

    // Try AI-enhanced valuation first
    let aiResult = null;
    if (c.env.DEEPSEEK_API_KEY) {
      const aiBusinessData = {
        ramo_atividade: business.ramo_atividade,
        segmento: business.segmento,
        tempo_atuacao: business.tempo_atuacao,
        faturamento_mensal: faturamento,
        despesas_fixas: despesas,
        num_funcionarios: business.num_funcionarios,
      };
      aiResult = await generateQuickAIValuation(aiBusinessData, c.env.DEEPSEEK_API_KEY);
    }

    let valorMinimo: number;
    let valorMaximo: number;
    let multiplicadorMin: number;
    let multiplicadorMax: number;

    if (aiResult && aiResult.valor_minimo && aiResult.valor_maximo) {
      // Use AI-generated values
      valorMinimo = aiResult.valor_minimo;
      valorMaximo = aiResult.valor_maximo;
      multiplicadorMin = aiResult.multiplo_min || 2.0;
      multiplicadorMax = aiResult.multiplo_max || 3.5;
    } else {
      // Fallback to manual calculation
      const lucroLiquidoMensal = faturamento - despesas;
      const lucroLiquidoAnual = lucroLiquidoMensal * 12;

      // Get sector and determine multiples
      const segmento = String(business.segmento || "Geral");
      multiplicadorMin = 2.0;
      multiplicadorMax = 3.5;

      // Adjust multiples based on sector
      const sectorMultiples: Record<string, { min: number; max: number }> = {
        "Tecnologia": { min: 3.0, max: 5.0 },
        "Saúde": { min: 2.5, max: 4.0 },
        "Educação": { min: 2.5, max: 4.0 },
        "Serviços": { min: 2.0, max: 3.5 },
        "Comércio": { min: 1.5, max: 3.0 },
        "Indústria": { min: 2.0, max: 3.5 },
        "Alimentação": { min: 2.0, max: 3.5 },
        "Consultoria": { min: 2.5, max: 4.5 },
      };

      if (sectorMultiples[segmento]) {
        multiplicadorMin = sectorMultiples[segmento].min;
        multiplicadorMax = sectorMultiples[segmento].max;
      }

      // Calculate assets value
      const valorImoveis = parseValueRange(business.valor_imoveis as string);
      const valorFrota = parseValueRange(business.valor_frota as string);
      const ativosIncluidos = valorImoveis + valorFrota;

      // Calculate valuation range
      valorMinimo = (lucroLiquidoAnual * multiplicadorMin) + ativosIncluidos;
      valorMaximo = (lucroLiquidoAnual * multiplicadorMax) + ativosIncluidos;
    }

    // Calculate lucro for database storage
    const lucroLiquidoMensal = faturamento - despesas;
    const lucroLiquidoAnual = lucroLiquidoMensal * 12;
    
    // Calculate assets value
    const valorImoveis = parseValueRange(business.valor_imoveis as string);
    const valorFrota = parseValueRange(business.valor_frota as string);
    const ativosIncluidos = valorImoveis + valorFrota;

    // Get segmento for database
    const segmento = String(business.segmento || "Geral");

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save to database
    await c.env.DB.prepare(
      `INSERT INTO quick_valuations (
        business_id, valor_minimo, valor_maximo, multiplo_min, multiplo_max,
        metodo, segmento, lucro_liquido_mensal_estimado, lucro_liquido_anual_estimado,
        ativos_incluidos, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        businessId,
        valorMinimo,
        valorMaximo,
        multiplicadorMin,
        multiplicadorMax,
        "Múltiplo de Lucro Líquido (estimado)",
        segmento,
        lucroLiquidoMensal,
        lucroLiquidoAnual,
        ativosIncluidos,
        expiresAt.toISOString()
      )
      .run();

    // Fetch the created valuation
    const newValuation = await c.env.DB.prepare(
      `SELECT * FROM quick_valuations WHERE business_id = ? ORDER BY created_at DESC LIMIT 1`
    )
      .bind(businessId)
      .first();

    return c.json({
      success: true,
      valuation: newValuation
    });
  } catch (error) {
    console.error("Error generating quick valuation:", error);
    return c.json({ error: "Erro ao gerar valuation rápido" }, 500);
  }
});

// POST /api/business/:id/generate-valuation-report - Generate PDF report
app.post("/:id/generate-valuation-report", authMiddleware, async (c) => {
  const user = c.get("user");
  const businessId = c.req.param("id");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Check ownership
    const business = await c.env.DB.prepare(
      `SELECT owner_id FROM businesses WHERE id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(String(user.id))
      .first();

    const isAdmin = profile?.user_type === "admin";
    const isOwner = business.owner_id === String(user.id);

    if (!isOwner && !isAdmin) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    // Check for active subscription
    const subscription = await c.env.DB.prepare(
      `SELECT plan_type FROM subscriptions 
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(String(user.id))
      .first();

    if (!subscription) {
      return c.json({ error: "Plano ativo necessário para gerar relatório" }, 403);
    }

    // Get the latest valuation
    const valuation = await c.env.DB.prepare(
      `SELECT * FROM valuations 
       WHERE business_id = ? AND type = 'complete'
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(businessId)
      .first();

    if (!valuation) {
      return c.json({ error: "Nenhum valuation encontrado" }, 404);
    }

    // Generate a unique report ID
    const reportId = generateUUID();

    // Update valuation with report_id
    await c.env.DB.prepare(
      `UPDATE valuations SET report_id = ? WHERE id = ?`
    )
      .bind(reportId, valuation.id)
      .run();

    // In production, you would generate the actual PDF here using a library like pdfkit
    // For now, we just return the report_id
    // TODO: Implement actual PDF generation

    return c.json({
      success: true,
      report_id: reportId,
      message: "Relatório gerado com sucesso",
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return c.json({ error: "Erro ao gerar relatório" }, 500);
  }
});

export default app;
