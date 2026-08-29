import { drawDaleelekWatermark, WatermarkOptions } from './imageCompressor';

export interface VideoValidationResult {
  valid: boolean;
  duration: number; // in seconds
  thumbnail?: string;
  error?: string;
}

/**
 * Validates that an uploaded video is strictly within the 30-second limit
 * and creates a watermarked thumbnail frame snapshot
 */
export async function validateAndProcessShortVideo(
  file: File,
  maxDurationSeconds = 30.5,
  watermarkOptions?: WatermarkOptions
): Promise<VideoValidationResult> {
  return new Promise((resolve) => {
    // 1. Check MIME type
    if (!file.type.startsWith('video/')) {
      resolve({
        valid: false,
        duration: 0,
        error: 'الملف المحدد ليس ملف فيديو صالح. يرجى اختيار فيديو بصيغة MP4 أو WebM أو MOV.',
      });
      return;
    }

    // 2. Check File Size (Max 40MB)
    const maxSizeBytes = 40 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      resolve({
        valid: false,
        duration: 0,
        error: 'حجم الفيديو كبير جداً. الحد الأقصى لحجم الفيديو هو 40 ميجابايت.',
      });
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    // Timeout safety
    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(videoUrl);
      resolve({
        valid: false,
        duration: 0,
        error: 'استغرق فحص الفيديو وقتاً أطول من المتوقع، يرجى تجربة فيديو آخر.',
      });
    }, 10000);

    video.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      const duration = video.duration;

      if (isNaN(duration) || duration <= 0) {
        URL.revokeObjectURL(videoUrl);
        resolve({
          valid: false,
          duration: 0,
          error: 'تعذر قراءة مدة الفيديو. يرجى التأكد من سلامة الملف.',
        });
        return;
      }

      if (duration > maxDurationSeconds) {
        URL.revokeObjectURL(videoUrl);
        resolve({
          valid: false,
          duration: Math.round(duration),
          error: `⚠️ مدة الفيديو (${Math.round(duration)} ثانية) تتجاوز الحد الأقصى المسموح به (30 ثانية). يرجى قص الفيديو قبل الرفع.`,
        });
        return;
      }

      // Generate thumbnail snapshot at 0.5s or 20%
      const seekTime = Math.min(1.0, duration * 0.2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, video.videoWidth || 480);
        canvas.height = Math.round((canvas.width * (video.videoHeight || 360)) / (video.videoWidth || 480));

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Stamp Daleelek official watermark on video thumbnail snapshot
          drawDaleelekWatermark(ctx, canvas.width, canvas.height, {
            position: watermarkOptions?.position || 'bottom-right',
            opacity: 0.92,
          });

          const thumbnail = canvas.toDataURL('image/jpeg', 0.85);
          const duration = video.duration;
          URL.revokeObjectURL(videoUrl);

          resolve({
            valid: true,
            duration: Math.round(duration * 10) / 10,
            thumbnail,
          });
          return;
        }
      } catch (err) {
        console.warn('Thumbnail capture notice:', err);
      }

      URL.revokeObjectURL(videoUrl);
      resolve({
        valid: true,
        duration: Math.round(video.duration * 10) / 10,
      });
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(videoUrl);
      resolve({
        valid: false,
        duration: 0,
        error: 'حدث خطأ أثناء قراءة ملف الفيديو. يرجى التأكد من تشغيل الصيغة.',
      });
    };
  });
}

/**
 * Converts a Video File into a Data URL for instant rendering & offline storage
 */
export async function convertVideoToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
