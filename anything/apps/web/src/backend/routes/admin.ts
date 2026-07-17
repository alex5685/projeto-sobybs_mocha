import { Hono } from "hono";
import type { Env } from "../../shared/types";
import { authMiddleware } from "@/lib/auth";

const admin = new Hono<{ Bindings: Env }>();

// Public endpoint to get institutional settings (no auth required)
admin.get("/institutional", async (c) => {
  try {
    const settings = await c.env.DB.prepare(
      `SELECT setting_key, setting_value FROM system_settings WHERE category = 'institucional'`
    ).all();

    const data: Record<string, string> = {};
    settings.results.forEach((setting: any) => {
      data[setting.setting_key] = setting.setting_value;
    });

    return c.json({ institutional: data });
  } catch (error) {
    console.error("Error fetching institutional settings:", error);
    return c.json({ error: "Erro ao buscar dados institucionais" }, 500);
  }
});

// Public endpoint to get contact settings (no auth required)
admin.get("/contacts", async (c) => {
  try {
    const settings = await c.env.DB.prepare(
      `SELECT setting_key, setting_value FROM system_settings WHERE category = 'contatos'`
    ).all();

    const data: Record<string, string> = {};
    settings.results.forEach((setting: any) => {
      data[setting.setting_key] = setting.setting_value;
    });

    return c.json({ contacts: data });
  } catch (error) {
    console.error("Error fetching contact settings:", error);
    return c.json({ error: "Erro ao buscar dados de contato" }, 500);
  }
});

// Middleware to check if user is admin
const requireAdmin = async (c: any, next: any) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const profile = await c.env.DB.prepare(
    `SELECT user_type FROM user_profiles WHERE id = ?`
  )
    .bind(user.id)
    .first();

  if (!profile || profile.user_type !== "admin") {
    return c.json({ error: "Acesso negado. Apenas administradores." }, 403);
  }

  await next();
};

// Get all system settings
admin.get("/settings", authMiddleware, requireAdmin, async (c) => {
  try {
    const settings = await c.env.DB.prepare(
      `SELECT * FROM system_settings ORDER BY category, setting_key`
    ).all();

    return c.json({ settings: settings.results });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return c.json({ error: "Erro ao buscar configurações" }, 500);
  }
});

// Get settings by category
admin.get("/settings/category/:category", authMiddleware, requireAdmin, async (c) => {
  try {
    const category = c.req.param("category");
    
    const settings = await c.env.DB.prepare(
      `SELECT * FROM system_settings WHERE category = ? ORDER BY setting_key`
    )
      .bind(category)
      .all();

    return c.json({ settings: settings.results });
  } catch (error) {
    console.error("Error fetching settings by category:", error);
    return c.json({ error: "Erro ao buscar configurações" }, 500);
  }
});

// Update a setting
admin.put("/settings/:key", authMiddleware, requireAdmin, async (c) => {
  try {
    const key = c.req.param("key");
    const { value } = await c.req.json();

    if (value === undefined || value === null) {
      return c.json({ error: "Valor é obrigatório" }, 400);
    }

    const result = await c.env.DB.prepare(
      `UPDATE system_settings 
       SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE setting_key = ?`
    )
      .bind(String(value), key)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao atualizar configuração" }, 500);
    }

    const updated = await c.env.DB.prepare(
      `SELECT * FROM system_settings WHERE setting_key = ?`
    )
      .bind(key)
      .first();

    return c.json({ setting: updated });
  } catch (error) {
    console.error("Error updating setting:", error);
    return c.json({ error: "Erro ao atualizar configuração" }, 500);
  }
});

// Create a new setting
admin.post("/settings", authMiddleware, requireAdmin, async (c) => {
  try {
    const { setting_key, setting_value, setting_type, description, category } = await c.req.json();

    if (!setting_key || !setting_value || !setting_type || !category) {
      return c.json({ error: "Campos obrigatórios: setting_key, setting_value, setting_type, category" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(setting_key, String(setting_value), setting_type, description || null, category)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao criar configuração" }, 500);
    }

    const created = await c.env.DB.prepare(
      `SELECT * FROM system_settings WHERE setting_key = ?`
    )
      .bind(setting_key)
      .first();

    return c.json({ setting: created }, 201);
  } catch (error) {
    console.error("Error creating setting:", error);
    return c.json({ error: "Erro ao criar configuração" }, 500);
  }
});

// Delete a setting
admin.delete("/settings/:key", authMiddleware, requireAdmin, async (c) => {
  try {
    const key = c.req.param("key");

    const result = await c.env.DB.prepare(
      `DELETE FROM system_settings WHERE setting_key = ?`
    )
      .bind(key)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao deletar configuração" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting setting:", error);
    return c.json({ error: "Erro ao deletar configuração" }, 500);
  }
});

// FAQ endpoints

// Get all FAQs (public endpoint)
admin.get("/faqs/all", async (c) => {
  try {
    const faqs = await c.env.DB.prepare(
      `SELECT * FROM faqs WHERE is_active = 1 ORDER BY display_order`
    ).all();

    return c.json({ faqs: faqs.results });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return c.json({ error: "Erro ao buscar FAQs" }, 500);
  }
});

// Get all FAQs (admin)
admin.get("/faqs", authMiddleware, requireAdmin, async (c) => {
  try {
    const faqs = await c.env.DB.prepare(
      `SELECT * FROM faqs ORDER BY display_order`
    ).all();

    return c.json({ faqs: faqs.results });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return c.json({ error: "Erro ao buscar FAQs" }, 500);
  }
});

// Create a new FAQ
admin.post("/faqs", authMiddleware, requireAdmin, async (c) => {
  try {
    const { question, answer, display_order } = await c.req.json();

    if (!question || !answer) {
      return c.json({ error: "Campos obrigatórios: question, answer" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO faqs (question, answer, display_order)
       VALUES (?, ?, ?)`
    )
      .bind(question, answer, display_order || 0)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao criar FAQ" }, 500);
    }

    const created = await c.env.DB.prepare(
      `SELECT * FROM faqs WHERE id = last_insert_rowid()`
    ).first();

    return c.json({ faq: created }, 201);
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return c.json({ error: "Erro ao criar FAQ" }, 500);
  }
});

// Update a FAQ
admin.put("/faqs/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const { question, answer, display_order, is_active } = await c.req.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (question !== undefined) {
      updates.push("question = ?");
      values.push(question);
    }
    if (answer !== undefined) {
      updates.push("answer = ?");
      values.push(answer);
    }
    if (display_order !== undefined) {
      updates.push("display_order = ?");
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ error: "Nenhum campo para atualizar" }, 400);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const result = await c.env.DB.prepare(
      `UPDATE faqs SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao atualizar FAQ" }, 500);
    }

    const updated = await c.env.DB.prepare(
      `SELECT * FROM faqs WHERE id = ?`
    )
      .bind(id)
      .first();

    return c.json({ faq: updated });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return c.json({ error: "Erro ao atualizar FAQ" }, 500);
  }
});

// Delete a FAQ
admin.delete("/faqs/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      `DELETE FROM faqs WHERE id = ?`
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao deletar FAQ" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return c.json({ error: "Erro ao deletar FAQ" }, 500);
  }
});

// Plan Services endpoints

// Get all services for all plans (public endpoint)
admin.get("/plan-services/all", async (c) => {
  try {
    const services = await c.env.DB.prepare(
      `SELECT * FROM plan_services WHERE is_active = 1 ORDER BY plan_name, display_order`
    ).all();

    // Group by plan
    const grouped: Record<string, any[]> = {
      bronze: [],
      silver: [],
      gold: [],
    };

    services.results.forEach((service: any) => {
      if (grouped[service.plan_name]) {
        grouped[service.plan_name].push(service);
      }
    });

    return c.json({ services: grouped });
  } catch (error) {
    console.error("Error fetching plan services:", error);
    return c.json({ error: "Erro ao buscar serviços dos planos" }, 500);
  }
});

// Get all services (admin)
admin.get("/plan-services", authMiddleware, requireAdmin, async (c) => {
  try {
    const services = await c.env.DB.prepare(
      `SELECT * FROM plan_services ORDER BY plan_name, display_order`
    ).all();

    return c.json({ services: services.results });
  } catch (error) {
    console.error("Error fetching plan services:", error);
    return c.json({ error: "Erro ao buscar serviços dos planos" }, 500);
  }
});

// Create a new service
admin.post("/plan-services", authMiddleware, requireAdmin, async (c) => {
  try {
    const { plan_name, service_description, display_order } = await c.req.json();

    if (!plan_name || !service_description) {
      return c.json({ error: "Campos obrigatórios: plan_name, service_description" }, 400);
    }

    if (!['bronze', 'silver', 'gold'].includes(plan_name)) {
      return c.json({ error: "Plano inválido. Use: bronze, silver ou gold" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO plan_services (plan_name, service_description, display_order)
       VALUES (?, ?, ?)`
    )
      .bind(plan_name, service_description, display_order || 0)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao criar serviço" }, 500);
    }

    const created = await c.env.DB.prepare(
      `SELECT * FROM plan_services WHERE id = last_insert_rowid()`
    ).first();

    return c.json({ service: created }, 201);
  } catch (error) {
    console.error("Error creating service:", error);
    return c.json({ error: "Erro ao criar serviço" }, 500);
  }
});

// Update a service
admin.put("/plan-services/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const { service_description, display_order, is_active } = await c.req.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (service_description !== undefined) {
      updates.push("service_description = ?");
      values.push(service_description);
    }
    if (display_order !== undefined) {
      updates.push("display_order = ?");
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ error: "Nenhum campo para atualizar" }, 400);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const result = await c.env.DB.prepare(
      `UPDATE plan_services SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao atualizar serviço" }, 500);
    }

    const updated = await c.env.DB.prepare(
      `SELECT * FROM plan_services WHERE id = ?`
    )
      .bind(id)
      .first();

    return c.json({ service: updated });
  } catch (error) {
    console.error("Error updating service:", error);
    return c.json({ error: "Erro ao atualizar serviço" }, 500);
  }
});

// Delete a service
admin.delete("/plan-services/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      `DELETE FROM plan_services WHERE id = ?`
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao deletar serviço" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return c.json({ error: "Erro ao deletar serviço" }, 500);
  }
});

// Get statistics for admin dashboard
admin.get("/stats", authMiddleware, requireAdmin, async (c) => {
  try {
    // Get total users
    const usersCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM user_profiles`
    ).first();

    // Get total businesses
    const businessesCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM businesses`
    ).first();

    // Get active subscriptions
    const activeSubscriptions = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`
    ).first();

    // Get total revenue from subscriptions
    const totalRevenue = await c.env.DB.prepare(
      `SELECT SUM(monthly_value) as total FROM subscriptions WHERE status = 'active'`
    ).first();

    // Get users by type
    const usersByType = await c.env.DB.prepare(
      `SELECT user_type, COUNT(*) as count FROM user_profiles GROUP BY user_type`
    ).all();

    // Get subscriptions by plan
    const subscriptionsByPlan = await c.env.DB.prepare(
      `SELECT plan_type, COUNT(*) as count FROM subscriptions WHERE status = 'active' GROUP BY plan_type`
    ).all();

    return c.json({
      stats: {
        totalUsers: usersCount?.count || 0,
        totalBusinesses: businessesCount?.count || 0,
        activeSubscriptions: activeSubscriptions?.count || 0,
        monthlyRevenue: totalRevenue?.total || 0,
        usersByType: usersByType.results,
        subscriptionsByPlan: subscriptionsByPlan.results,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Erro ao buscar estatísticas" }, 500);
  }
});

export default admin;
