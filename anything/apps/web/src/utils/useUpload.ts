'use client';
import React from 'react';

interface ReactNativeAsset {
  file?: File;
  uri: string;
  name?: string;
  mimeType?: string;
}

interface UploadInput {
  reactNativeAsset?: ReactNativeAsset;
  file?: File;
  url?: string;
  base64?: string;
  buffer?: Buffer;
}

interface UploadResult {
  url?: string;
  mimeType?: string | null;
  error?: string;
}

interface UploadHookResult {
  loading: boolean;
}

// The platform's built-in upload endpoint — same one the mobile app uses.
// It handles auth, storage, and CDN automatically.
const UPLOAD_ENDPOINT = '/_create/api/upload/';

function useUpload(): [(input: UploadInput) => Promise<UploadResult>, UploadHookResult] {
  const [loading, setLoading] = React.useState(false);

  const upload = React.useCallback(async (input: UploadInput): Promise<UploadResult> => {
    setLoading(true);
    try {
      let response: Response;

      if (
        ('file' in input && input.file) ||
        ('reactNativeAsset' in input && input.reactNativeAsset?.file)
      ) {
        const file = ('file' in input ? input.file : input.reactNativeAsset?.file) as File;
        const form = new FormData();
        form.append('file', file);
        response = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: form });
      } else if ('url' in input && input.url) {
        response = await fetch(UPLOAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input.url }),
        });
      } else if ('base64' in input && input.base64) {
        response = await fetch(UPLOAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: input.base64 }),
        });
      } else if ('buffer' in input && input.buffer) {
        response = await fetch(UPLOAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: input.buffer as unknown as BodyInit,
        });
      } else {
        return { error: 'Nenhum arquivo fornecido para upload' };
      }

      if (!response.ok) {
        if (response.status === 413) return { error: 'Arquivo muito grande para upload' };
        const body = await response.text().catch(() => '');
        return { error: `Upload falhou (${response.status}): ${body}` };
      }

      const data = (await response.json()) as { url?: string; mimeType?: string | null };
      return { url: data.url, mimeType: data.mimeType ?? null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload falhou';
      console.error('[useUpload]', message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;
