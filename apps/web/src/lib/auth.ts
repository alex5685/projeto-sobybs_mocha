import { Pool, neonConfig } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.AUTH_URL,
  process.env.EXPO_PUBLIC_PROXY_BASE_URL,
  process.env.EXPO_PUBLIC_BASE_URL,
  process.env.NEXT_PUBLIC_CREATE_APP_URL,
  process.env.NEXT_PUBLIC_CREATE_BASE_URL,
  process.env.NEXT_PUBLIC_CREATE_HOST ? `https://${process.env.NEXT_PUBLIC_CREATE_HOST}` : null,
  'https://www.anything.com',
].filter((v): v is string => Boolean(v));

export const auth = betterAuth({
  database: pool,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  advanced: {
    cookiePrefix: 'better-auth',
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      path: '/',
    },
    cookies: {
      sessionToken: {
        attributes: {
          sameSite: 'none',
          secure: true,
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  plugins: [bearer()],
});

export type Session = typeof auth.$Infer.Session;
