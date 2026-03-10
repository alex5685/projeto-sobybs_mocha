import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";

const app = new Hono<{ Bindings: Env }>();

// POST /api/users/registration - Save user registration data (PF or PJ)
app.post("/registration", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const userId = user.id;
  const body = await c.req.json();

  const {
    person_type,
    full_name,
    phone,
    cpf,
    legal_name,
    cnpj,
    cpf_socio,
  } = body;

  // Validate required fields based on person_type
  if (person_type === "pf") {
    if (!full_name || !phone || !cpf) {
      return c.json({ error: "Campos obrigatórios não preenchidos" }, 400);
    }
  } else if (person_type === "pj") {
    if (!legal_name || !phone || !cnpj || !cpf_socio) {
      return c.json({ error: "Campos obrigatórios não preenchidos" }, 400);
    }
  } else {
    return c.json({ error: "Tipo de pessoa inválido" }, 400);
  }

  try {
    // Update user_profiles table with registration data
    await c.env.DB.prepare(
      `UPDATE user_profiles 
       SET person_type = ?, 
           full_name = ?, 
           phone = ?, 
           cpf = ?, 
           legal_name = ?, 
           cnpj = ?, 
           cpf_socio = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    )
      .bind(
        person_type,
        full_name || null,
        phone,
        cpf || null,
        legal_name || null,
        cnpj || null,
        cpf_socio || null,
        userId
      )
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving user registration:", error);
    return c.json({ error: "Erro ao salvar dados" }, 500);
  }
});

export default app;
