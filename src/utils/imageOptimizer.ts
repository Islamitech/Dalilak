/**
 * Image Delivery & Performance Optimization Utility for Dalelak
 * Converts uncompressed Google Place and CDN images to responsive WebP formats on-the-fly.
 */

export function getOptimizedImageUrl(url: string | undefined | null, width = 600, height?: number): string {
  if (!url || typeof url !== 'string') return '';

  // Google Place Photos & User Content CDN
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    const [base] = url.split('=');
    const targetHeight = height || Math.round(width * 0.75);
    return `${base}=w${width}-h${targetHeight}-n-rw`;
  }

  return url;
}
