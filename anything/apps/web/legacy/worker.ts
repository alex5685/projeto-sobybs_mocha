// @ts-nocheck
import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import authRoutes from "../backend/routes/auth";
import profileRoutes from "../backend/routes/profiles";
import usersRoutes from "../backend/routes/users";
import businessRoutes from "../backend/routes/business";
import adminRoutes from "../backend/routes/admin";
import teamRoutes from "../backend/routes/team";
import paymentsRoutes from "../backend/routes/payments";
import documentsRoutes from "../backend/routes/documents";
import filesRoutes from "../backend/routes/files";
import valuationsRoutes from "../backend/routes/valuations";
import subscriptionsRoutes from "../backend/routes/subscriptions";

const app = new Hono<{ Bindings: Env }>();

app.route("/api", authRoutes);
app.route("/api/profiles", profileRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/business", businessRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/team", teamRoutes);
app.route("/api/payments", paymentsRoutes);
app.route("/api/documents", documentsRoutes);
app.route("/api/files", filesRoutes);
app.route("/api/valuations", valuationsRoutes);
app.route("/api/subscriptions", subscriptionsRoutes);

// Reports endpoint (for protected PDF downloads)
app.get("/api/reports/:reportId/download", authMiddleware, async (c) => {
  const user = c.get("user");
  const reportId = c.req.param("reportId");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Find valuation with this report_id
    const valuation = await c.env.DB.prepare(
      `SELECT v.*, b.owner_id FROM valuations v
       JOIN businesses b ON v.business_id = b.id
       WHERE v.report_id = ?`
    )
      .bind(reportId)
      .first();

    if (!valuation) {
      return c.json({ error: "Relatório não encontrado" }, 404);
    }

    // Check authorization
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(String(user.id))
      .first();

    const isAdmin = profile?.user_type === "admin";
    const isOwner = valuation.owner_id === String(user.id);

    if (!isOwner && !isAdmin) {
      return c.json({ error: "Acesso negado" }, 403);
    }

    // In production, you would fetch the PDF from R2 storage and stream it
    // For now, we return a placeholder response
    // TODO: Implement actual PDF streaming from R2

    // Placeholder: Return JSON with download info
    return c.json({
      success: true,
      message: "Relatório disponível para download",
      report_id: reportId,
      // In production: return PDF stream or signed URL
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return c.json({ error: "Erro ao baixar relatório" }, 500);
  }
});

export default app;
