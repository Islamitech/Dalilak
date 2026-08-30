/**
 * Utility to download business photos easily for manual Google Maps upload
 */

export const downloadSinglePhoto = async (dataUrlOrUrl: string, filename: string): Promise<void> => {
  try {
    const cleanFilename = filename.endsWith('.jpg') || filename.endsWith('.png') ? filename : `${filename}.jpg`;
    
    // If it's a remote URL, fetch as blob to bypass browser cross-origin download filename restrictions
    let downloadHref = dataUrlOrUrl;
    let objectUrlToRevoke: string | null = null;

    if (dataUrlOrUrl.startsWith('http://') || dataUrlOrUrl.startsWith('https://')) {
      try {
        const response = await fetch(dataUrlOrUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          downloadHref = URL.createObjectURL(blob);
          objectUrlToRevoke = downloadHref;
        }
      } catch {
        // Fallback to direct URL if fetch fails
        downloadHref = dataUrlOrUrl;
      }
    }

    const link = document.createElement('a');
    link.href = downloadHref;
    link.download = cleanFilename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (objectUrlToRevoke) {
      setTimeout(() => URL.revokeObjectURL(objectUrlToRevoke!), 10000);
    }
  } catch (error) {
    console.error('Error downloading photo:', error);
  }
};

export const downloadAllBusinessPhotos = async (photos: string[], businessName: string): Promise<void> => {
  if (!photos || photos.length === 0) return;
  
  const cleanName = (businessName || 'business')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const filename = `${cleanName}-photo-${i + 1}.jpg`;
    await downloadSinglePhoto(photo, filename);
    // Controlled delay between multiple file downloads to prevent browser popup suppression
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
};

export const copyImageToClipboard = async (dataUrlOrUrl: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return false;
    }

    // Convert image to PNG blob via an offscreen canvas to guarantee browser support
    const pngBlob = await new Promise<Blob | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrlOrUrl;
    });

    if (!pngBlob) {
      return false;
    }

    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Clipboard image write not supported or failed:', err);
    return false;
  }
};
