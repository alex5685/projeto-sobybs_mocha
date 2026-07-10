import { Hono } from "hono";
import { authMiddleware } from "@/lib/auth";
import Stripe from "stripe";

type PaymentsEnv = {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  GEMINI_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
};

const app = new Hono<{ Bindings: PaymentsEnv }>();

// Profile pricing (monthly, in cents)
const PROFILE_PRICING = {
  comprador: 3300, // R$ 33/month
  vendedor: 3300,  // R$ 33/month
  hibrido: 6600,   // R$ 66/month
} as const;

// Create checkout session for profile subscription
app.post("/create-checkout-session", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { profile_type } = await c.req.json();

    // Validate profile type
    if (!["comprador", "vendedor", "hibrido"].includes(profile_type)) {
      return c.json({ error: "Invalid profile type" }, 400);
    }

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    const price = PROFILE_PRICING[profile_type as keyof typeof PROFILE_PRICING];

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Sobybs - Perfil ${profile_type.charAt(0).toUpperCase() + profile_type.slice(1)}`,
              description: `Assinatura mensal para perfil ${profile_type}`,
            },
            unit_amount: price,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${c.req.header("origin")}/dashboard?payment=success`,
      cancel_url: `${c.req.header("origin")}/profile-setup?payment=cancelled`,
      metadata: {
        user_id: user.id,
        profile_type,
      },
      customer_email: user.email,
    });

    return c.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// Stripe webhook handler
app.post("/webhook", async (c) => {
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return c.text("Invalid signature", 400);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const profileType = session.metadata?.profile_type;

      if (!userId || !profileType) {
        console.error("Missing metadata in checkout session");
        break;
      }

      try {
        // Create or update user profile with paid status
        const existingProfile = await c.env.DB.prepare(
          "SELECT * FROM user_profiles WHERE id = ?"
        )
          .bind(userId)
          .first();

        if (existingProfile) {
          await c.env.DB.prepare(
            `UPDATE user_profiles 
             SET user_type = ?, subscription_level = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`
          )
            .bind(profileType, "active", userId)
            .run();
        } else {
          await c.env.DB.prepare(
            `INSERT INTO user_profiles (id, email, user_type, subscription_level, created_at, updated_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
            .bind(userId, session.customer_email, profileType, "active")
            .run();
        }

        // Record the transaction
        await c.env.DB.prepare(
          `INSERT INTO transactions (id, user_id, amount, type, payment_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
          .bind(
            session.id,
            userId,
            session.amount_total ? session.amount_total / 100 : 0,
            "subscription",
            "completed"
          )
          .run();

        console.log(`Profile activated for user ${userId}: ${profileType}`);
      } catch (error) {
        console.error("Error updating profile after payment:", error);
      }
      break;
    }

    case "customer.subscription.deleted": {
      try {
        // Find user by customer ID and deactivate subscription
        const profile = await c.env.DB.prepare(
          "SELECT * FROM user_profiles WHERE email IN (SELECT email FROM user_profiles LIMIT 1)"
        ).first();

        if (profile) {
          await c.env.DB.prepare(
            `UPDATE user_profiles 
             SET subscription_level = ?, user_type = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`
          )
            .bind("cancelled", "basico", profile.id)
            .run();

          console.log(`Subscription cancelled for user ${profile.id}`);
        }
      } catch (error) {
        console.error("Error handling subscription cancellation:", error);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`Payment failed for invoice ${invoice.id}`);
      // Could send notification to user here
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return c.text("ok", 200);
});

export default app;
