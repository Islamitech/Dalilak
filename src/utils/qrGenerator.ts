import QRCode from 'qrcode';

/**
 * ⚡ Standard Offline QR Code Generator (Client-side / 100% Zero-network)
 * Generates ISO/IEC 18004 standard-compliant QR codes as SVG Data URLs.
 * Fully readable by all phone cameras, Google Lens, and barcode readers.
 * 100% offline, zero CORS issues with html-to-image.
 */
export function generateQrDataUrl(text: string, size: number = 250): string {
  try {
    if (!text || typeof text !== 'string') return '';
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const margin = 2; // Quiet zone
    const totalDim = moduleCount + margin * 2;

    let path = '';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          path += `M${c + margin} ${r + margin}h1v1h-1z `;
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${totalDim}" height="${totalDim}" fill="#ffffff"/><path d="${path.trim()}" fill="#0f172a"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch (err) {
    console.warn('QR Code generation error:', err);
    return '';
  }
}

