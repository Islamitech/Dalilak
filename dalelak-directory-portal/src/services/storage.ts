import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://xdqpbajymacpdccorjcj.supabase.co').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x').trim();
export const BUCKET_NAME = 'business-media';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string; ext: string } {
  const parts = dataUrl.split(';base64,');
  const mimeType = parts[0]?.split(':')[1] || 'image/jpeg';
  const byteString = atob(parts[1] || '');
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  const ext = mimeType.includes('video') ? (mimeType.includes('webm') ? 'webm' : 'mp4') : (mimeType.includes('png') ? 'png' : 'jpg');
  return {
    blob: new Blob([uint8Array], { type: mimeType }),
    mimeType,
    ext,
  };
}

export async function uploadMediaToSupabaseStorage(
  media: string | File | Blob,
  folder: 'photos' | 'videos' = 'photos',
  customName?: string
): Promise<string> {
  if (typeof media === 'string' && (media.startsWith('http://') || media.startsWith('https://'))) {
    return media;
  }

  try {
    let blob: Blob;
    let mimeType = 'image/jpeg';
    let ext = 'jpg';

    if (typeof media === 'string' && media.startsWith('data:')) {
      const parsed = dataUrlToBlob(media);
      blob = parsed.blob;
      mimeType = parsed.mimeType;
      ext = parsed.ext;
    } else if (media instanceof File || media instanceof Blob) {
      blob = media;
      mimeType = media.type || 'image/jpeg';
      ext = mimeType.includes('video') ? 'mp4' : 'jpg';
    } else {
      return typeof media === 'string' ? media : '';
    }

    const cleanName = customName || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `${folder}/${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Storage upload notice:', err);
  }

  return typeof media === 'string' ? media : '';
}
