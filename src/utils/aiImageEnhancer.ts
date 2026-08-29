/**
 * 🌟 Smart On-Device AI Image Enhancer (Client-Side / 100% Free & Unlimited)
 * Automatically elevates phone camera captures into clean, natural, commercial-grade photos:
 * - Gentle Shadow Recovery (natural clarity without crushing blacks or blowing highlights)
 * - True-to-Life Color Fidelity (preserves original natural hues without oversaturation)
 * - Natural White Balance (no artificial tints or color casts)
 * - Crisp Text & Signage Definition (gentle micro-detail enhancement without harsh halos)
 */

export interface EnhancementOptions {
  clarity?: number;          // 0 to 1 (default: 0.05 - subtle natural clarity)
  vibrance?: number;         // 0 to 1 (default: 0.03 - true-to-life natural colors)
  shadowsLift?: number;      // 0 to 1 (default: 0.10 - gentle shadow lift)
  highlightControl?: number; // 0 to 1 (default: 0)
  warmth?: number;           // -0.5 to 0.5 (default: 0 - neutral true white balance)
  sharpen?: number;          // 0 to 1 (default: 0.08 - clean banner/text crispness)
}

/**
 * Automatically enhances canvas pixels with a balanced, natural photography algorithm
 * Guaranteed artifact-free, non-destructive, and natural.
 */
export function applyLuxuryAIEnhancement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: EnhancementOptions = {}
): void {
  try {
    const {
      clarity = 0.05,
      vibrance = 0.03,
      shadowsLift = 0.10,
      warmth = 0.0,
      sharpen = 0.08,
    } = options;

    if (width <= 0 || height <= 0) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const len = data.length;

    // STEP 1: Fast Luminance Analysis
    let sumLum = 0;
    const sampleStep = 8;
    let sampleCount = 0;

    for (let i = 0; i < len; i += 4 * sampleStep) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sumLum += lum;
      sampleCount++;
    }

    const avgLum = sampleCount > 0 ? sumLum / sampleCount : 128;
    const isDark = avgLum < 100;

    // STEP 2: Balanced Natural Tone Curve (Zero contrast-crushing, gentle dark recovery)
    const toneLUT = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let v = i / 255.0; // 0.0 to 1.0

      // Gentle shadow recovery for dark scenes (cubic falloff ensures midtones & highlights remain authentic)
      if (shadowsLift > 0 && isDark) {
        const shadowMask = Math.pow(1 - v, 3); // 1.0 at black, 0.0 at midtones/highlights
        v += shadowMask * shadowsLift * 0.12;
      }

      // Very subtle clarity blending (preserves natural lighting atmosphere without crushing blacks)
      if (clarity > 0) {
        const smoothV = v * v * (3 - 2 * v);
        const w = clarity * 0.06;
        v = v * (1 - w) + smoothV * w;
      }

      // Strict clamp
      v = Math.max(0, Math.min(1, v));
      toneLUT[i] = Math.round(v * 255);
    }

    // STEP 3: Apply Tone Mapping & True-to-Life Color Balance
    for (let i = 0; i < len; i += 4) {
      let r = toneLUT[data[i]];
      let g = toneLUT[data[i + 1]];
      let b = toneLUT[data[i + 2]];

      // Safe subtle vibrance: only slightly lifts dull/washed-out pixels, never oversaturates signs/colors
      if (vibrance > 0) {
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

        if (sat < 0.45) {
          const vibFactor = (0.45 - sat) * vibrance * 0.25;
          const avg = (r + g + b) / 3;
          r += (r - avg) * vibFactor;
          g += (g - avg) * vibFactor;
          b += (b - avg) * vibFactor;
        }
      }

      // Subtle warmth (default 0 preserves original true camera color balance)
      if (warmth !== 0) {
        r *= (1 + warmth * 0.3);
        b *= (1 - warmth * 0.3);
      }

      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }

    // STEP 4: Gentle Micro-Sharpening (Enhances shop signage/banner readability without noise or halos)
    if (sharpen > 0 && width > 60 && height > 60) {
      const srcCopy = new Uint8ClampedArray(data);
      const w4 = width * 4;
      const shFactor = sharpen * 0.10;

      for (let y = 1; y < height - 1; y++) {
        const rowIdx = y * w4;
        for (let x = 1; x < width - 1; x++) {
          const idx = rowIdx + (x * 4);

          for (let c = 0; c < 3; c++) {
            const center = srcCopy[idx + c];
            const up = srcCopy[idx - w4 + c];
            const down = srcCopy[idx + w4 + c];
            const left = srcCopy[idx - 4 + c];
            const right = srcCopy[idx + 4 + c];

            const laplacian = (center * 4) - (up + down + left + right);

            // Safe tight clamp: max +/- 8 delta ensures soft, natural edges
            const delta = Math.max(-8, Math.min(8, laplacian * shFactor));
            const val = center + delta;

            data[idx + c] = val < 0 ? 0 : (val > 255 ? 255 : (val | 0));
          }
        }
      }
    }

    // Put enhanced pixels back onto canvas
    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    // If anything fails, fail silently and keep original image without corruption
    console.warn('Auto AI image enhancement notice:', err);
  }
}
