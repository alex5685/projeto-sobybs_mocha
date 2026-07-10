import { Hono } from "hono";
import type { Env } from "../../shared/types";
import { authMiddleware } from "@/lib/auth";

const team = new Hono<{ Bindings: Env }>();

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

// Public endpoint - get active team members
team.get("/members", async (c) => {
  try {
    const members = await c.env.DB.prepare(
      `SELECT id, name, role, bio, photo_url, email, display_order 
       FROM team_members 
       WHERE is_active = 1 
       ORDER BY display_order ASC, created_at ASC`
    ).all();

    return c.json({ members: members.results });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return c.json({ error: "Erro ao buscar membros do time" }, 500);
  }
});

// Admin - get all team members
team.get("/members/all", authMiddleware, requireAdmin, async (c) => {
  try {
    const members = await c.env.DB.prepare(
      `SELECT * FROM team_members ORDER BY display_order ASC, created_at ASC`
    ).all();

    return c.json({ members: members.results });
  } catch (error) {
    console.error("Error fetching all team members:", error);
    return c.json({ error: "Erro ao buscar membros do time" }, 500);
  }
});

// Admin - create team member
team.post("/members", authMiddleware, requireAdmin, async (c) => {
  try {
    const { name, role, bio, photo_url, email, display_order } = await c.req.json();

    if (!name || !role) {
      return c.json({ error: "Nome e cargo são obrigatórios" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO team_members (name, role, bio, photo_url, email, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(name, role, bio || null, photo_url || null, email || null, display_order || 0)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao criar membro do time" }, 500);
    }

    const created = await c.env.DB.prepare(
      `SELECT * FROM team_members WHERE id = ?`
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json({ member: created }, 201);
  } catch (error) {
    console.error("Error creating team member:", error);
    return c.json({ error: "Erro ao criar membro do time" }, 500);
  }
});

// Admin - update team member
team.put("/members/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const { name, role, bio, photo_url, email, display_order, is_active } = await c.req.json();

    const result = await c.env.DB.prepare(
      `UPDATE team_members 
       SET name = ?, role = ?, bio = ?, photo_url = ?, email = ?, 
           display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(name, role, bio, photo_url, email, display_order, is_active ? 1 : 0, id)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao atualizar membro do time" }, 500);
    }

    const updated = await c.env.DB.prepare(
      `SELECT * FROM team_members WHERE id = ?`
    )
      .bind(id)
      .first();

    return c.json({ member: updated });
  } catch (error) {
    console.error("Error updating team member:", error);
    return c.json({ error: "Erro ao atualizar membro do time" }, 500);
  }
});

// Admin - delete team member
team.delete("/members/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      `DELETE FROM team_members WHERE id = ?`
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao deletar membro do time" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return c.json({ error: "Erro ao deletar membro do time" }, 500);
  }
});

// Public endpoint - get active job openings
team.get("/jobs", async (c) => {
  try {
    const jobs = await c.env.DB.prepare(
      `SELECT id, title, department, location, employment_type, description, requirements 
       FROM job_openings 
       WHERE is_active = 1 
       ORDER BY created_at DESC`
    ).all();

    return c.json({ jobs: jobs.results });
  } catch (error) {
    console.error("Error fetching job openings:", error);
    return c.json({ error: "Erro ao buscar vagas" }, 500);
  }
});

// Admin - get all job openings
team.get("/jobs/all", authMiddleware, requireAdmin, async (c) => {
  try {
    const jobs = await c.env.DB.prepare(
      `SELECT * FROM job_openings ORDER BY created_at DESC`
    ).all();

    return c.json({ jobs: jobs.results });
  } catch (error) {
    console.error("Error fetching all job openings:", error);
    return c.json({ error: "Erro ao buscar vagas" }, 500);
  }
});

// Admin - create job opening
team.post("/jobs", authMiddleware, requireAdmin, async (c) => {
  try {
    const { title, department, location, employment_type, description, requirements } = await c.req.json();

    if (!title || !description) {
      return c.json({ error: "Título e descrição são obrigatórios" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO job_openings (title, department, location, employment_type, description, requirements)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(title, department || null, location || null, employment_type || null, description, requirements || null)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao criar vaga" }, 500);
    }

    const created = await c.env.DB.prepare(
      `SELECT * FROM job_openings WHERE id = ?`
    )
      .bind(result.meta.last_row_id)
      .first();

    return c.json({ job: created }, 201);
  } catch (error) {
    console.error("Error creating job opening:", error);
    return c.json({ error: "Erro ao criar vaga" }, 500);
  }
});

// Admin - update job opening
team.put("/jobs/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const { title, department, location, employment_type, description, requirements, is_active } = await c.req.json();

    const result = await c.env.DB.prepare(
      `UPDATE job_openings 
       SET title = ?, department = ?, location = ?, employment_type = ?, 
           description = ?, requirements = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(title, department, location, employment_type, description, requirements, is_active ? 1 : 0, id)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao atualizar vaga" }, 500);
    }

    const updated = await c.env.DB.prepare(
      `SELECT * FROM job_openings WHERE id = ?`
    )
      .bind(id)
      .first();

    return c.json({ job: updated });
  } catch (error) {
    console.error("Error updating job opening:", error);
    return c.json({ error: "Erro ao atualizar vaga" }, 500);
  }
});

// Admin - delete job opening
team.delete("/jobs/:id", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      `DELETE FROM job_openings WHERE id = ?`
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao deletar vaga" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting job opening:", error);
    return c.json({ error: "Erro ao deletar vaga" }, 500);
  }
});

// Public endpoint - submit job application
team.post("/applications", async (c) => {
  try {
    const formData = await c.req.formData();
    const job_opening_id = formData.get("job_opening_id");
    const candidate_name = formData.get("candidate_name");
    const candidate_email = formData.get("candidate_email");
    const candidate_phone = formData.get("candidate_phone");
    const cover_letter = formData.get("cover_letter");
    const cv_file = formData.get("cv_file") as File;

    if (!job_opening_id || !candidate_name || !candidate_email || !cv_file) {
      return c.json({ error: "Dados obrigatórios: vaga, nome, email e CV" }, 400);
    }

    // Upload CV to R2
    const cv_storage_key = `cvs/${Date.now()}_${cv_file.name}`;
    await c.env.R2_BUCKET.put(cv_storage_key, cv_file.stream() as any);

    // Save application to database
    const result = await c.env.DB.prepare(
      `INSERT INTO job_applications 
       (job_opening_id, candidate_name, candidate_email, candidate_phone, 
        cv_storage_key, cv_file_name, cover_letter)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        job_opening_id,
        candidate_name,
        candidate_email,
        candidate_phone || null,
        cv_storage_key,
        cv_file.name,
        cover_letter || null
      )
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao enviar candidatura" }, 500);
    }

    return c.json({ 
      success: true,
      message: "Candidatura enviada com sucesso!"
    }, 201);
  } catch (error) {
    console.error("Error submitting application:", error);
    return c.json({ error: "Erro ao enviar candidatura" }, 500);
  }
});

// Admin - get all applications
team.get("/applications", authMiddleware, requireAdmin, async (c) => {
  try {
    const applications = await c.env.DB.prepare(
      `SELECT 
         a.*,
         j.title as job_title
       FROM job_applications a
       LEFT JOIN job_openings j ON a.job_opening_id = j.id
       ORDER BY a.created_at DESC`
    ).all();

    return c.json({ applications: applications.results });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return c.json({ error: "Erro ao buscar candidaturas" }, 500);
  }
});

// Admin - download CV
team.get("/applications/:id/cv", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    
    const application = await c.env.DB.prepare(
      `SELECT cv_storage_key, cv_file_name FROM job_applications WHERE id = ?`
    )
      .bind(id)
      .first();

    if (!application) {
      return c.json({ error: "Candidatura não encontrada" }, 404);
    }

    const cv = await c.env.R2_BUCKET.get(application.cv_storage_key as string);
    
    if (!cv) {
      return c.json({ error: "CV não encontrado" }, 404);
    }

    return new Response(cv.body as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${application.cv_file_name}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading CV:", error);
    return c.json({ error: "Erro ao baixar CV" }, 500);
  }
});

// Admin - update application status
team.put("/applications/:id/status", authMiddleware, requireAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();

    const result = await c.env.DB.prepare(
      `UPDATE job_applications 
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(status, id)
      .run();

    if (!result.success) {
      return c.json({ error: "Erro ao atualizar status" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating application status:", error);
    return c.json({ error: "Erro ao atualizar status" }, 500);
  }
});

export default team;
