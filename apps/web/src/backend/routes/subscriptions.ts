import { Hono } from "hono";
import { authMiddleware } from "@/lib/auth";
import type { Env } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// GET /api/subscriptions/active - Check if user has active subscription
app.get("/active", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const subscription = await c.env.DB.prepare(
      `SELECT plan_type, status FROM subscriptions 
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(String(user.id))
      .first();

    if (subscription) {
      return c.json({
        has_active_plan: true,
        plan_type: subscription.plan_type,
      });
    }

    return c.json({
      has_active_plan: false,
      plan_type: null,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return c.json({ error: "Failed to check subscription" }, 500);
  }
});

export default app;
