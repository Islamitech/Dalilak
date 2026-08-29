import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../lib/supabase';
import { uploadMediaToSupabaseStorage } from './storage';
import { Business } from '../types';

/**
 * 🔄 Automated Migration Utility: Converts legacy Base64 stored photos/videos
 * into clean, ultra-fast Supabase Storage CDN URLs ('business-media' bucket).
 */
export async function migrateLegacyBase64BusinessesToStorage(): Promise<{
  total: number;
  migrated: number;
  skipped: number;
  details: string[];
}> {
  if (!isSupabaseConfigured()) {
    return { total: 0, migrated: 0, skipped: 0, details: ['Supabase not configured'] };
  }

  const details: string[] = [];
  let migratedCount = 0;
  let skippedCount = 0;

  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !businesses || !Array.isArray(businesses)) {
      return { total: 0, migrated: 0, skipped: 0, details: ['Failed to fetch businesses from Supabase'] };
    }

    for (const biz of businesses) {
      let isChanged = false;
      let rawPhotos: string[] = [];
      let rawVideos: string[] = [];

      // 1. Check & Parse Photos
      if (Array.isArray(biz.photos)) {
        rawPhotos = biz.photos;
      } else if (typeof biz.photos === 'string' && biz.photos.trim().length > 0) {
        try {
          const parsed = JSON.parse(biz.photos);
          if (Array.isArray(parsed)) rawPhotos = parsed;
        } catch {
          if (biz.photos.startsWith('data:')) rawPhotos = [biz.photos];
        }
      }

      // 2. Check & Parse Videos
      if (Array.isArray(biz.videos)) {
        rawVideos = biz.videos;
      } else if (typeof biz.videos === 'string' && biz.videos.trim().length > 0) {
        try {
          const parsed = JSON.parse(biz.videos);
          if (Array.isArray(parsed)) rawVideos = parsed;
        } catch {
          if (biz.videos.startsWith('data:')) rawVideos = [biz.videos];
        }
      }

      // Parse metadata inside notes if present
      let parsedNotesObj: any = null;
      if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
        try {
          parsedNotesObj = JSON.parse(biz.notes.trim());
          if (parsedNotesObj && Array.isArray(parsedNotesObj.videos) && rawVideos.length === 0) {
            rawVideos = parsedNotesObj.videos;
          }
        } catch {}
      }

      // 3. Migrate Base64 Photos to Storage
      const cleanPhotos: string[] = [];
      for (let idx = 0; idx < rawPhotos.length; idx++) {
        const photo = rawPhotos[idx];
        if (photo.startsWith('data:image/') || photo.length > 5000) {
          isChanged = true;
          try {
            const publicUrl = await uploadMediaToSupabaseStorage(photo, 'photos', `${biz.id}_p${idx}.jpg`);
            cleanPhotos.push(publicUrl);
          } catch (e) {
            cleanPhotos.push(photo);
          }
        } else {
          cleanPhotos.push(photo);
        }
      }

      // 4. Migrate Base64 Videos to Storage
      const cleanVideos: string[] = [];
      for (let idx = 0; idx < rawVideos.length; idx++) {
        const vid = rawVideos[idx];
        if (vid.startsWith('data:video/') || vid.length > 10000) {
          isChanged = true;
          try {
            const publicUrl = await uploadMediaToSupabaseStorage(vid, 'videos', `${biz.id}_v${idx}.mp4`);
            cleanVideos.push(publicUrl);
          } catch (e) {
            cleanVideos.push(vid);
          }
        } else {
          cleanVideos.push(vid);
        }
      }

      // 5. Update Database Record if Changed
      if (isChanged) {
        const updatePayload: any = {
          photos: cleanPhotos,
          videos: cleanVideos,
        };

        if (parsedNotesObj) {
          parsedNotesObj.videos = cleanVideos;
          updatePayload.notes = JSON.stringify(parsedNotesObj);
        }

        const { error: updateError } = await supabase
          .from('businesses')
          .update(updatePayload)
          .eq('id', biz.id);

        if (!updateError) {
          migratedCount++;
          details.push(`✓ تم ترحيل صور نشاط: "${biz.name_ar || biz.id}" بنجاح.`);
        } else {
          // REST Fallback PATCH
          await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(biz.id)}`, {
            method: 'PATCH',
            body: JSON.stringify(updatePayload),
          });
          migratedCount++;
          details.push(`✓ تم ترحيل صور نشاط: "${biz.name_ar || biz.id}" عبر REST.`);
        }
      } else {
        skippedCount++;
      }
    }

    return {
      total: businesses.length,
      migrated: migratedCount,
      skipped: skippedCount,
      details,
    };
  } catch (err: any) {
    return {
      total: 0,
      migrated: migratedCount,
      skipped: skippedCount,
      details: [`خطأ أثناء الترحيل: ${err.message || err}`],
    };
  }
}
