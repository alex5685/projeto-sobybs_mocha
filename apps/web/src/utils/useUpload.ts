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

// Uses the platform's own upload proxy at /_create/api/upload/
// This handles Uploadcare authentication server-side, so no API key needed here.
function useUpload(): [(input: UploadInput) => Promise<UploadResult>, UploadHookResult] {
  const [loading, setLoading] = React.useState(false);

  const upload = React.useCallback(async (input: UploadInput): Promise<UploadResult> => {
    try {
      setLoading(true);
      let response: Response | undefined;

      if ('reactNativeAsset' in input && input.reactNativeAsset) {
        const asset = input.reactNativeAsset;
        if (asset.file) {
          const formData = new FormData();
          formData.append('file', asset.file);
          response = await fetch('/_create/api/upload/', {
            method: 'POST',
            body: formData,
          });
        } else {
          throw new Error('Upload client not configured for this asset type');
        }
      } else if ('file' in input && input.file) {
        const formData = new FormData();
        formData.append('file', input.file);
        response = await fetch('/_create/api/upload/', {
          method: 'POST',
          body: formData,
        });
      } else if ('url' in input) {
        response = await fetch('/_create/api/upload/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input.url }),
        });
      } else if ('base64' in input) {
        response = await fetch('/_create/api/upload/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: input.base64 }),
        });
      } else {
        response = await fetch('/_create/api/upload/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: input.buffer as unknown as BodyInit,
        });
      }

      if (!response || !response.ok) {
        if (response?.status === 413) {
          throw new Error('Upload falhou: arquivo muito grande.');
        }
        let apiError = `Upload falhou (HTTP ${response?.status ?? 'sem resposta'})`;
        try {
          const errData = (await response?.json()) as { error?: string };
          if (errData?.error) apiError = errData.error;
        } catch {
          // ignore
        }
        throw new Error(apiError);
      }

      const data = (await response.json()) as { url?: string; mimeType?: string | null };
      return { url: data.url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      if (uploadError instanceof Error) return { error: uploadError.message };
      if (typeof uploadError === 'string') return { error: uploadError };
      return { error: 'Upload falhou' };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export default useUpload;
