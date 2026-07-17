import { NextRequest } from 'next/server';

// GET /api/upload-config — returns the Uploadcare public key for client-side uploads
// This is intentionally unauthenticated: it's a PUBLIC key designed to be used in the browser.
export async function GET(_req: NextRequest) {
  const pubKey = process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY ?? '';
  if (!pubKey) {
    return Response.json({ error: 'Upload não configurado' }, { status: 500 });
  }
  return Response.json({ pubKey });
}
