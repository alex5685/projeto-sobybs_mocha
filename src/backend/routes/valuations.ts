import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import type { Env } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// GET /api/valuations/:id - Get a specific quick valuation by ID
app.get("/:id", async (c) => {
  const valuationId = c.req.param("id");

  try {
    const valuation = await c.env.DB.prepare(
      `SELECT * FROM quick_valuations WHERE id = ?`
    )
      .bind(valuationId)
      .first();

    if (!valuation) {
      return c.json({ error: "Valuation não encontrado" }, 404);
    }

    return c.json({ 
      success: true,
      valuation 
    });
  } catch (error) {
    console.error("Error fetching valuation:", error);
    return c.json({ error: "Erro ao buscar valuation" }, 500);
  }
});

// POST /api/valuations/:id/track - Track conversion events for analytics
app.post("/:id/track", async (c) => {
  const valuationId = c.req.param("id");
  const body = await c.req.json();
  const { event, source } = body;

  try {
    // Try to find valuation in unified table first
    let valuation = await c.env.DB.prepare(
      `SELECT id, business_id, type FROM valuations WHERE id = ?`
    )
      .bind(valuationId)
      .first();

    // Fallback to quick_valuations table for backwards compatibility
    if (!valuation) {
      const quickVal = await c.env.DB.prepare(
        `SELECT id, business_id FROM quick_valuations WHERE id = ?`
      )
        .bind(valuationId)
        .first();
      
      if (quickVal) {
        valuation = { id: quickVal.id, business_id: quickVal.business_id, type: 'quick' };
      }
    }

    if (!valuation) {
      return c.json({ error: "Valuation não encontrado" }, 404);
    }

    // Handle different tracking events
    if (event === "plan_page_view" && source && valuation.type) {
      // Update last_plan_page_source for attribution (only for unified table)
      await c.env.DB.prepare(
        `UPDATE valuations SET last_plan_page_source = ? WHERE id = ?`
      )
        .bind(source, valuationId)
        .run();
    } else if (event === "clicked_upgrade") {
      // Log the upgrade click (conversion will be marked when subscription activates)
      console.log(`Upgrade clicked for valuation ${valuationId}`, { source });
    } else if (event === "email_opened") {
      // Log email open event
      console.log(`Email opened for valuation ${valuationId}`, { source });
    }

    // Log all tracking events
    console.log(`Valuation tracking: ${event}`, {
      valuationId,
      businessId: valuation.business_id,
      source,
      timestamp: new Date().toISOString(),
    });

    return c.json({ 
      success: true,
      message: "Evento rastreado com sucesso" 
    });
  } catch (error) {
    console.error("Error tracking valuation event:", error);
    return c.json({ error: "Erro ao rastrear evento" }, 500);
  }
});

// GET /api/valuations/quick/expired - Get expired quick valuations for current user
app.get("/quick/expired", authMiddleware, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Get expired quick valuations (created more than 7 days ago, not yet notified)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredValuations = await c.env.DB.prepare(
      `SELECT v.*, b.alias_name as business_name
       FROM valuations v
       LEFT JOIN businesses b ON v.business_id = b.id
       WHERE v.user_id = ? 
       AND v.type = 'quick'
       AND v.notified_expiration = 0
       AND v.created_at < ?
       ORDER BY v.created_at DESC`
    )
      .bind(String(user.id), sevenDaysAgo.toISOString())
      .all();

    return c.json({
      success: true,
      expired_valuations: expiredValuations.results || [],
    });
  } catch (error) {
    console.error("Error fetching expired valuations:", error);
    return c.json({ error: "Erro ao buscar valuations expirados" }, 500);
  }
});

// POST /api/valuations/:id/mark-notified - Mark valuation as notified about expiration
app.post("/:id/mark-notified", authMiddleware, async (c) => {
  const user = c.get("user");
  const valuationId = c.req.param("id");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Verify ownership
    const valuation = await c.env.DB.prepare(
      `SELECT user_id FROM valuations WHERE id = ?`
    )
      .bind(valuationId)
      .first();

    if (!valuation) {
      return c.json({ error: "Valuation não encontrado" }, 404);
    }

    if (valuation.user_id !== String(user.id)) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    // Mark as notified
    await c.env.DB.prepare(
      `UPDATE valuations SET notified_expiration = 1 WHERE id = ?`
    )
      .bind(valuationId)
      .run();

    return c.json({
      success: true,
      message: "Valuation marcado como notificado",
    });
  } catch (error) {
    console.error("Error marking valuation as notified:", error);
    return c.json({ error: "Erro ao marcar notificação" }, 500);
  }
});

// GET /api/business/:id/complete-valuation - Get complete valuation for a business
app.get("/business/:id/complete-valuation", authMiddleware, async (c) => {
  const user = c.get("user");
  const businessId = c.req.param("id");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Check if user is owner or admin
    const business = await c.env.DB.prepare(
      `SELECT owner_id FROM businesses WHERE id = ?`
    )
      .bind(businessId)
      .first();

    if (!business) {
      return c.json({ error: "Empresa não encontrada" }, 404);
    }

    // Check user profile for admin status
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(String(user.id))
      .first();

    const isAdmin = profile?.user_type === "admin";
    const isOwner = business.owner_id === String(user.id);

    if (!isOwner && !isAdmin) {
      return c.json({ error: "Acesso negado. Apenas o proprietário ou admin podem acessar." }, 403);
    }

    // Check for active subscription
    const subscription = await c.env.DB.prepare(
      `SELECT plan_type, status FROM subscriptions 
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(String(user.id))
      .first();

    if (!subscription) {
      return c.json({ error: "Plano necessário para acessar valuation completo" }, 403);
    }

    const planType = subscription.plan_type as string;

    // Get or create complete valuation
    let valuation = await c.env.DB.prepare(
      `SELECT * FROM valuations 
       WHERE business_id = ? AND type = 'complete' AND status = 'done'
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(businessId)
      .first();

    // If no valuation exists, generate one
    if (!valuation) {
      // Get business details for valuation calculation
      const details = await c.env.DB.prepare(
        `SELECT * FROM business_details WHERE business_id = ?`
      )
        .bind(businessId)
        .first();

      // Simple valuation calculation (can be enhanced later)
      const faturamentoMap: Record<string, number> = {
        "Até R$ 10.000": 5000,
        "R$ 10.001 a R$ 50.000": 30000,
        "R$ 50.001 a R$ 100.000": 75000,
        "R$ 100.001 a R$ 500.000": 300000,
        "Acima de R$ 500.000": 750000,
      };

      const faturamentoMensal = faturamentoMap[details?.faturamento_mensal as string] || 50000;
      const faturamentoAnual = faturamentoMensal * 12;
      
      // Base valuation: 2-3x annual revenue
      const valorEstimado = faturamentoAnual * 2.5;
      const incerteza = planType === "bronze" ? 15 : planType === "silver" ? 10 : 5;
      const valorMinimo = valorEstimado * (1 - incerteza / 100);
      const valorMaximo = valorEstimado * (1 + incerteza / 100);

      // Generate methodology data based on plan
      const metodologias = [
        { nome: "Múltiplo de Lucro Líquido", valor: valorEstimado * 0.95, peso: 0.4 },
      ];

      if (planType === "silver" || planType === "gold") {
        metodologias.push(
          { nome: "Múltiplo de EBITDA", valor: valorEstimado * 1.05, peso: 0.3 },
          { nome: "Fluxo de Caixa Descontado", valor: valorEstimado, peso: 0.3 }
        );
      }

      if (planType === "gold") {
        metodologias.push(
          { nome: "Valor Patrimonial Ajustado", valor: valorEstimado * 0.9, peso: 0.15 },
          { nome: "Múltiplos de Transações", valor: valorEstimado * 1.1, peso: 0.15 }
        );
      }

      // Generate risks
      const riscos = [
        { categoria: "Operacional", descricao: "Dependência do proprietário", impacto: "alto", probabilidade: "média" },
        { categoria: "Mercado", descricao: "Concorrência local", impacto: "médio", probabilidade: "alta" },
        { categoria: "Financeiro", descricao: "Fluxo de caixa sazonal", impacto: "médio", probabilidade: "média" },
      ];

      if (planType === "silver" || planType === "gold") {
        riscos.push(
          { categoria: "Regulatório", descricao: "Mudanças na legislação", impacto: "médio", probabilidade: "baixa" },
          { categoria: "Tecnológico", descricao: "Obsolescência de processos", impacto: "baixo", probabilidade: "média" }
        );
      }

      // Generate recommendations
      const recomendacoes = [
        { titulo: "Diversificar base de clientes", prioridade: "alta", impacto_estimado: "alto", prazo: "curto" },
        { titulo: "Documentar processos operacionais", prioridade: "alta", impacto_estimado: "médio", prazo: "médio" },
        { titulo: "Implementar controles financeiros", prioridade: "média", impacto_estimado: "alto", prazo: "curto" },
      ];

      if (planType === "silver" || planType === "gold") {
        recomendacoes.push(
          { titulo: "Reduzir custos fixos em 10-15%", prioridade: "média", impacto_estimado: "médio", prazo: "médio" },
          { titulo: "Expandir canais de marketing digital", prioridade: "baixa", impacto_estimado: "médio", prazo: "longo" }
        );
      }

      // Intangibles (Gold only)
      let intangiveis = null;
      if (planType === "gold") {
        intangiveis = {
          valor_marca: valorEstimado * 0.15,
          processos: valorEstimado * 0.10,
          capital_humano: valorEstimado * 0.08,
          total: valorEstimado * 0.33,
        };
      }

      const scoreAtratividade = Math.min(10, Math.max(1, Math.round(5 + (valorEstimado / faturamentoAnual))));

      // Insert new valuation
      const result = await c.env.DB.prepare(
        `INSERT INTO valuations (
          user_id, business_id, type, status, plan_type,
          valor_estimado, valor_minimo, valor_maximo,
          nivel_incerteza_referencia, score_atratividade,
          metodologias_json, riscos_json, recomendacoes_json,
          intangiveis_json, revisions_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          String(user.id),
          businessId,
          "complete",
          "done",
          planType,
          valorEstimado,
          valorMinimo,
          valorMaximo,
          incerteza,
          scoreAtratividade,
          JSON.stringify(metodologias),
          JSON.stringify(riscos),
          JSON.stringify(recomendacoes),
          intangiveis ? JSON.stringify(intangiveis) : null,
          0
        )
        .run();

      // Fetch the newly created valuation
      valuation = await c.env.DB.prepare(
        `SELECT * FROM valuations WHERE id = ?`
      )
        .bind(result.meta.last_row_id)
        .first();
    }

    // Parse JSON fields
    if (!valuation) {
      return c.json({ error: "Erro ao criar valuation" }, 500);
    }

    const response = {
      success: true,
      plan_type: planType,
      valuation: {
        id: valuation.id,
        business_id: valuation.business_id,
        valor_estimado: valuation.valor_estimado,
        valor_minimo: valuation.valor_minimo,
        valor_maximo: valuation.valor_maximo,
        nivel_incerteza_referencia: valuation.nivel_incerteza_referencia,
        score_atratividade: valuation.score_atratividade,
        metodologias: JSON.parse(valuation.metodologias_json as string),
        riscos: JSON.parse(valuation.riscos_json as string),
        recomendacoes: JSON.parse(valuation.recomendacoes_json as string),
        intangiveis: valuation.intangiveis_json ? JSON.parse(valuation.intangiveis_json as string) : null,
        last_updated: valuation.updated_at || valuation.created_at,
        revisions_available: planType === "bronze" ? "1 a cada 90 dias" : "ilimitadas",
        revisions_count: valuation.revisions_count,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error("Error fetching complete valuation:", error);
    return c.json({ error: "Erro ao buscar valuation completo" }, 500);
  }
});

// POST /api/business/:id/request-revision - Request valuation revision
app.post("/business/:id/request-revision", authMiddleware, async (c) => {
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

    // Check subscription
    const subscription = await c.env.DB.prepare(
      `SELECT plan_type FROM subscriptions 
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(String(user.id))
      .first();

    if (!subscription) {
      return c.json({ error: "Plano ativo necessário" }, 403);
    }

    const planType = subscription.plan_type as string;

    // Get current valuation
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

    // Check revision limits for Bronze
    if (planType === "bronze") {
      const lastRevision = new Date(valuation.updated_at as string);
      const now = new Date();
      const daysSinceLastRevision = Math.floor((now.getTime() - lastRevision.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastRevision < 90) {
        return c.json({ 
          error: "Plano Bronze permite 1 revisão a cada 90 dias",
          days_remaining: 90 - daysSinceLastRevision 
        }, 429);
      }
    }

    // Update revision count and timestamp
    await c.env.DB.prepare(
      `UPDATE valuations 
       SET revisions_count = revisions_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(valuation.id)
      .run();

    return c.json({
      success: true,
      revision_id: valuation.id,
      status: "pending",
      message: "Revisão solicitada com sucesso",
    });
  } catch (error) {
    console.error("Error requesting revision:", error);
    return c.json({ error: "Erro ao solicitar revisão" }, 500);
  }
});

export default app;
