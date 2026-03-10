import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";

const app = new Hono<{ Bindings: Env }>();

// Get current user's profile
app.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const profile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE id = ?"
  )
    .bind(user.id)
    .first();

  return c.json(profile || null);
});

// Create or update user profile
app.post("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const body = await c.req.json();

  const { user_type, subscription_level } = body;

  // Validate user_type - Admin can only be set through backend/database, not through this endpoint
  const validTypes = ["basico", "comprador", "vendedor", "hibrido"];
  if (!validTypes.includes(user_type)) {
    return c.json({ error: "Invalid user type" }, 400);
  }

  // Check if profile exists
  const existingProfile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE id = ?"
  )
    .bind(user.id)
    .first();

  if (existingProfile) {
    // Update existing profile
    await c.env.DB.prepare(
      `UPDATE user_profiles 
       SET user_type = ?, subscription_level = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    )
      .bind(user_type, subscription_level || "none", user.id)
      .run();
  } else {
    // Create new profile
    await c.env.DB.prepare(
      `INSERT INTO user_profiles (id, email, user_type, subscription_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
      .bind(user.id, user.email, user_type, subscription_level || "none")
      .run();
  }

  // Fetch and return updated profile
  const updatedProfile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE id = ?"
  )
    .bind(user.id)
    .first();

  return c.json(updatedProfile);
});

export default app;
