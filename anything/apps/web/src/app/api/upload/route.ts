import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { upload } from '@/app/api/utils/upload';

/**
 * POST /api/upload
 * Accepts multipart/form-data (file), application/json ({ url } or { base64 }),
 * or raw octet-stream. Returns { url, mimeType }.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('multipart/form-data')) {
      let formData: FormData;
      try {
        formData = await req.formData();
      } catch (err) {
        console.error('[upload] formData parse error:', err);
        return Response.json({ error: 'Dados de upload inválidos' }, { status: 400 });
      }

      const file = formData.get('file') as File | null;
      if (!file) {
        return Response.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await upload({ buffer, mimeType: file.type, fileName: file.name });
      if (result.error) {
        console.error('[upload] error:', result.error);
        return Response.json({ error: result.error }, { status: 502 });
      }
      return Response.json({ url: result.url, mimeType: result.mimeType ?? file.type ?? null });
    } else if (contentType.includes('application/json')) {
      let body: { url?: string; base64?: string };
      try {
        body = (await req.json()) as { url?: string; base64?: string };
      } catch {
        return Response.json({ error: 'Body inválido' }, { status: 400 });
      }

      if (body.url) {
        const result = await upload({ url: body.url });
        if (result.error) {
          return Response.json({ error: result.error }, { status: 502 });
        }
        return Response.json({ url: result.url, mimeType: result.mimeType ?? null });
      } else if (body.base64) {
        const result = await upload({ base64: body.base64 });
        if (result.error) {
          return Response.json({ error: result.error }, { status: 502 });
        }
        return Response.json({ url: result.url, mimeType: result.mimeType ?? null });
      } else {
        return Response.json({ error: 'Payload inválido' }, { status: 400 });
      }
    } else {
      const arrayBuffer = await req.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await upload({ buffer, mimeType: contentType || 'application/octet-stream' });
      if (result.error) {
        return Response.json({ error: result.error }, { status: 502 });
      }
      return Response.json({ url: result.url, mimeType: result.mimeType ?? null });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[upload] exception:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
