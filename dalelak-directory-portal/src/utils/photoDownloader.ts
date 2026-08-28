/**
 * Utility to download business photos easily for manual Google Maps upload
 */

export const downloadSinglePhoto = (dataUrlOrBlob: string, filename: string) => {
  try {
    const link = document.createElement('a');
    link.href = dataUrlOrBlob;
    link.download = filename.endsWith('.jpg') || filename.endsWith('.png') ? filename : `${filename}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading photo:', error);
  }
};

export const downloadAllBusinessPhotos = async (photos: string[], businessName: string) => {
  if (!photos || photos.length === 0) return;
  
  const cleanName = (businessName || 'business')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const filename = `${cleanName}-photo-${i + 1}.jpg`;
    downloadSinglePhoto(photo, filename);
    // Slight delay between multiple file downloads to avoid browser block
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
};

export const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn('Clipboard image write not supported or failed:', err);
    return false;
  }
};
