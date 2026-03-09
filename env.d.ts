/// <reference types="@cloudflare/workers-types" />

declare global {
  // Re-export Cloudflare types globally
  type D1Database = import("@cloudflare/workers-types").D1Database;
  type R2Bucket = import("@cloudflare/workers-types").R2Bucket;
  
  interface Env {
    DB: D1Database;
    R2_BUCKET: R2Bucket;
    MOCHA_USERS_SERVICE_API_URL: string;
    MOCHA_USERS_SERVICE_API_KEY: string;
    GEMINI_API_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  }
}

export {};
