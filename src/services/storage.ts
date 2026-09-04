import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../lib/supabase';

export const BUCKET_NAME = 'business-media';

/**
 * Converts a Base64 data URL string into a Binary Blob for efficient upload
 */
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

/**
 * 🚀 Uploads a single media item (Base64 string, File, or Blob) to Supabase Storage
 * Returns the permanent public CDN URL
 */
export async function uploadMediaToSupabaseStorage(
  media: string | File | Blob,
  folder: 'photos' | 'videos' | 'avatars' = 'photos',
  customName?: string
): Promise<string> {
  // If it's already a hosted URL (http/https), return it directly
  if (typeof media === 'string' && (media.startsWith('http://') || media.startsWith('https://'))) {
    return media;
  }

  if (!isSupabaseConfigured()) {
    // If offline or no Supabase, return original string
    return typeof media === 'string' ? media : '';
  }

  try {
    let blob: Blob;
    let mimeType = 'image/jpeg';
    let ext = 'jpg';

    if (typeof media === 'string' && media.startsWith('data:')) {
      try {
        // High-performance asynchronous conversion off the main JS thread (no UI freezing)
        const fetchRes = await fetch(media);
        blob = await fetchRes.blob();
        mimeType = blob.type || 'image/jpeg';
        ext = mimeType.includes('video') ? (mimeType.includes('webm') ? 'webm' : 'mp4') : (mimeType.includes('png') ? 'png' : 'jpg');
      } catch {
        const parsed = dataUrlToBlob(media);
        blob = parsed.blob;
        mimeType = parsed.mimeType;
        ext = parsed.ext;
      }
    } else if (media instanceof File) {
      blob = media;
      mimeType = media.type || 'image/jpeg';
      ext = media.name.split('.').pop() || (mimeType.includes('video') ? 'mp4' : 'jpg');
    } else if (media instanceof Blob) {
      blob = media;
      mimeType = media.type || 'image/jpeg';
      ext = mimeType.includes('video') ? 'mp4' : 'jpg';
    } else {
      return typeof media === 'string' ? media : '';
    }

    const cleanName = customName || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `${folder}/${cleanName}`;

    // 1. Direct Supabase Storage Client Upload
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '31536000', // 1 year cache
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

    // 2. Direct REST Fallback Upload to Supabase Storage Endpoint
    const storageRestUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/${BUCKET_NAME}/${filePath}`;
    const restRes = await fetch(storageRestUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: blob,
    });

    if (restRes.ok) {
      return `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
    }
  } catch (err) {
    console.warn('Storage upload notice:', err);
  }

  // Fallback to original string if upload fails
  return typeof media === 'string' ? media : '';
}

/**
 * ⚡ Batch upload multiple photos/videos in parallel to Supabase Storage
 */
export async function uploadMultipleMediaToStorage(
  items: (string | File | Blob)[],
  folder: 'photos' | 'videos' = 'photos'
): Promise<string[]> {
  if (!items || items.length === 0) return [];
  const uploadPromises = items.map((item) => uploadMediaToSupabaseStorage(item, folder));
  return Promise.all(uploadPromises);
}
