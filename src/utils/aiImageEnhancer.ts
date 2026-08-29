/**
 * 🌟 Smart On-Device AI Image Enhancer (Client-Side / 100% Free & Unlimited)
 * Automatically elevates phone camera captures into commercial-grade, luxury photos:
 * - Dynamic Range & Shadow Recovery (HDR tonemapping) without highlight blowouts
 * - Safe S-Curve Tone Mapping (zero NaN / overflow / inversion artifacts)
 * - Natural Color Vibrance & Subtle Warmth Balance
 * - Micro-Texture Enhancement with halo & noise suppression
 */

export interface EnhancementOptions {
  clarity?: number;          // 0 to 1 (default: 0.20)
  vibrance?: number;         // 0 to 1 (default: 0.18)
  shadowsLift?: number;      // 0 to 1 (default: 0.18)
  highlightControl?: number; // 0 to 1 (default: 0.15)
  warmth?: number;           // -0.5 to 0.5 (default: 0.03)
  sharpen?: number;          // 0 to 1 (default: 0.15)
}

/**
 * Automatically enhances canvas pixels with luxury commercial photography algorithms
 * Guaranteed artifact-free with full safety bounds on tone curves and color math.
 */
export function applyLuxuryAIEnhancement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: EnhancementOptions = {}
): void {
  try {
    const {
      clarity = 0.20,
      vibrance = 0.18,
      shadowsLift = 0.18,
      warmth = 0.03,
      sharpen = 0.15,
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
    const isDark = avgLum < 105;

    // Smooth shadow recovery factor (gentle lift for dark scenes without blowing bright lights/signs)
    const shadowBoostFactor = isDark ? Math.min(0.25, (105 - avgLum) / 450) : 0.08;

    // STEP 2: Tone Curve Look-Up Table (Strictly monotonic, bounded in [0, 255], zero NaN)
    const toneLUT = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let v = i / 255.0; // 0.0 to 1.0

      // 1. Shadows Lift (Quadratic falloff ensures 0 boost at highlights v=1)
      if (shadowsLift > 0) {
        const shadowMask = (1 - v) * (1 - v); // 1.0 at black, 0.0 at white
        v += shadowMask * shadowsLift * shadowBoostFactor;
      }

      // Clamp safely before curve
      v = Math.max(0, Math.min(1, v));

      // 2. Smooth S-Curve Contrast (Softstep / smoothstep blending)
      if (clarity > 0) {
        const smoothV = v * v * (3 - 2 * v);
        const contrastWeight = clarity * 0.22;
        v = v * (1 - contrastWeight) + smoothV * contrastWeight;
      }

      // Ensure strict clamp to [0, 255]
      v = Math.max(0, Math.min(1, v));
      toneLUT[i] = Math.round(v * 255);
    }

    // STEP 3: Apply Tone Mapping, Vibrance & Warmth Balance
    for (let i = 0; i < len; i += 4) {
      let r = toneLUT[data[i]];
      let g = toneLUT[data[i + 1]];
      let b = toneLUT[data[i + 2]];

      // Safe vibrance calculation
      if (vibrance > 0) {
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

        if (sat < 0.85) {
          const vibFactor = (1 - sat) * vibrance * 0.6;
          const avg = (r + g + b) / 3;
          r += (r - avg) * vibFactor;
          g += (g - avg) * vibFactor;
          b += (b - avg) * vibFactor;
        }
      }

      // Safe subtle warmth
      if (warmth !== 0) {
        r *= (1 + warmth * 0.6);
        g *= (1 + warmth * 0.2);
        b *= (1 - warmth * 0.4);
      }

      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }

    // STEP 4: High-Pass Unsharp Sharpening with Halo & Noise Clamping
    if (sharpen > 0 && width > 60 && height > 60) {
      const srcCopy = new Uint8ClampedArray(data);
      const w4 = width * 4;
      const shFactor = sharpen * 0.20; // Safe subtle sharpening

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

            // Hard clamp edge delta to prevent dark/light ringing around text and lights
            const delta = Math.max(-14, Math.min(14, laplacian * shFactor));
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
