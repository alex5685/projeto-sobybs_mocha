import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// POST /api/upload — receives a file from the client, forwards it to Uploadcare, returns the CDN URL
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  let file: File | null = null;

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      console.error('[upload] formData parse error:', err);
      return Response.json({ error: 'Dados de upload inválidos' }, { status: 400 });
    }
    file = formData.get('file') as File | null;
  } else if (contentType.includes('application/json')) {
    let body: { url?: string; base64?: string };
    try {
      body = (await req.json()) as { url?: string; base64?: string };
    } catch {
      return Response.json({ error: 'Body inválido' }, { status: 400 });
    }
    if (body.url) {
      try {
        const remote = await fetch(body.url);
        if (!remote.ok) throw new Error(`remote fetch ${remote.status}`);
        const blob = await remote.blob();
        const name = body.url.split('/').pop() ?? 'file';
        file = new File([blob], name, { type: blob.type });
      } catch (err) {
        console.error('[upload] Failed to fetch remote URL:', err);
        return Response.json({ error: 'Falha ao buscar URL remota' }, { status: 400 });
      }
    } else if (body.base64) {
      const parts = body.base64.split(',');
      const header = parts[0] ?? '';
      const data = parts[1] ?? body.base64;
      const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      file = new File([bytes], 'upload', { type: mime });
    }
  }

  if (!file) {
    return Response.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const ucPubKey =
    process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY ??
    process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ??
    '';

  if (!ucPubKey) {
    console.error('[upload] Uploadcare public key not configured');
    return Response.json({ error: 'Serviço de upload não configurado' }, { status: 500 });
  }

  const uploadForm = new FormData();
  uploadForm.append('UPLOADCARE_PUB_KEY', ucPubKey);
  uploadForm.append('UPLOADCARE_STORE', '1');
  uploadForm.append('file', file);

  let ucRes: Response;
  try {
    ucRes = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: uploadForm,
    });
  } catch (err) {
    console.error('[upload] Uploadcare network error:', err);
    return Response.json({ error: 'Erro de conexão com o serviço de upload' }, { status: 502 });
  }

  const responseText = await ucRes.text();

  if (!ucRes.ok) {
    console.error('[upload] Uploadcare error:', ucRes.status, responseText);
    return Response.json(
      { error: `Uploadcare retornou ${ucRes.status}: ${responseText}` },
      { status: 502 }
    );
  }

  let ucData: { file?: string };
  try {
    ucData = JSON.parse(responseText) as { file?: string };
  } catch {
    console.error('[upload] Uploadcare response not JSON:', responseText);
    return Response.json(
      { error: `Resposta inválida do Uploadcare: ${responseText}` },
      { status: 502 }
    );
  }

  const uuid = ucData.file;
  if (!uuid) {
    console.error('[upload] Uploadcare: no UUID in response', ucData);
    return Response.json(
      { error: 'Upload falhou: UUID não retornado pelo Uploadcare' },
      { status: 502 }
    );
  }

  const url = `https://ucarecdn.com/${uuid}/`;
  return Response.json({ url, mimeType: file.type || null });
}
