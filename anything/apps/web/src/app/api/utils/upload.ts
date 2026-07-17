/**
 * Backend upload utility — uploads files directly to Uploadcare.
 * Accepts { url }, { base64 }, or { buffer } inputs.
 * Returns { url, mimeType, error }.
 */

interface UploadInput {
  buffer?: Buffer | Uint8Array;
  url?: string;
  base64?: string;
  mimeType?: string;
  fileName?: string;
}

interface UploadResult {
  url?: string;
  mimeType?: string | null;
  error?: string;
}

const UC_BASE = 'https://upload.uploadcare.com';

/** Build a multipart/form-data body manually (reliable in Node.js serverless) */
async function uploadBuffer(
  buffer: Buffer | Uint8Array,
  filename: string,
  mime: string
): Promise<UploadResult> {
  // Read at call-time, not module-load-time, so the env var is always fresh
  const UC_PUB_KEY = process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY ?? '';
  if (!UC_PUB_KEY) {
    return { error: 'EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY não configurado' };
  }

  const boundary = `FormBoundary${Math.random().toString(36).slice(2)}`;
  const enc = new TextEncoder();
  const CRLF = '\r\n';

  const header =
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="UPLOADCARE_PUB_KEY"${CRLF}${CRLF}` +
    `${UC_PUB_KEY}${CRLF}` +
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="UPLOADCARE_STORE"${CRLF}${CRLF}` +
    `1${CRLF}` +
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
    `Content-Type: ${mime}${CRLF}${CRLF}`;

  const footer = `${CRLF}--${boundary}--${CRLF}`;

  const headerBytes = enc.encode(header);
  const footerBytes = enc.encode(footer);
  // Both Buffer and Uint8Array expose .buffer/.byteOffset/.byteLength — no branching needed
  const fileBytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const body = new Uint8Array(headerBytes.length + fileBytes.length + footerBytes.length);
  body.set(headerBytes, 0);
  body.set(fileBytes, headerBytes.length);
  body.set(footerBytes, headerBytes.length + fileBytes.length);

  const res = await fetch(`${UC_BASE}/base/`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('[upload] Uploadcare error:', res.status, text);
    return { error: `Uploadcare retornou ${res.status}: ${text}` };
  }

  let data: { file?: string };
  try {
    data = JSON.parse(text) as { file?: string };
  } catch {
    return { error: `Resposta inesperada do Uploadcare: ${text}` };
  }

  if (!data.file) {
    return { error: `Uploadcare não retornou UUID: ${text}` };
  }

  return { url: `https://ucarecdn.com/${data.file}/`, mimeType: mime };
}

export async function upload(input: UploadInput): Promise<UploadResult> {
  try {
    // Buffer upload
    if (input.buffer) {
      const mime = input.mimeType ?? 'application/octet-stream';
      const filename = input.fileName ?? 'upload';
      return await uploadBuffer(input.buffer, filename, mime);
    }

    // Base64 upload
    if (input.base64) {
      const parts = input.base64.split(',');
      const header = parts[0] ?? '';
      const data = parts[1] ?? input.base64;
      const mime = header.match(/:(.*?);/)?.[1] ?? input.mimeType ?? 'application/octet-stream';
      const ext = mime.split('/')[1] ?? 'bin';
      const buf = Buffer.from(data, 'base64');
      return await uploadBuffer(buf, input.fileName ?? `upload.${ext}`, mime);
    }

    // URL upload — fetch remotely then re-upload
    if (input.url) {
      const fetchRes = await fetch(input.url);
      if (!fetchRes.ok) {
        return { error: `Falha ao buscar URL remota: ${fetchRes.status}` };
      }
      const mime =
        fetchRes.headers.get('content-type')?.split(';')[0] ??
        input.mimeType ??
        'application/octet-stream';
      const buf = Buffer.from(await fetchRes.arrayBuffer());
      const filename = input.fileName ?? input.url.split('/').pop()?.split('?')[0] ?? 'upload';
      return await uploadBuffer(buf, filename, mime);
    }

    return { error: 'Nenhuma fonte fornecida (url, base64 ou buffer obrigatório)' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[upload util] exception:', msg);
    return { error: msg };
  }
}
