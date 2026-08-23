import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create SVG Icon Matching Concept 2 (Lighthouse Beacon + Verification Checkmark Swoosh)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="dalelakGold" x1="50" y1="50" x2="460" y2="460" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="25%" stop-color="#FDE68A" />
      <stop offset="55%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <linearGradient id="cyanEmerald" x1="50" y1="150" x2="460" y2="460" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="35%" stop-color="#06B6D4" />
      <stop offset="75%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="slateBase" x1="75" y1="75" x2="435" y2="435" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <filter id="beaconGlow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#06B6D4" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- 1. Outer Rounded Squircle Base -->
  <rect x="32" y="32" width="448" height="448" rx="118" fill="url(#slateBase)" stroke="url(#dalelakGold)" stroke-width="6" />

  <!-- 2. Concentric Light Ray Rings -->
  <circle cx="256" cy="205" r="128" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="8 8" opacity="0.35" fill="none" />
  <circle cx="256" cy="205" r="82" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="5 10" opacity="0.4" fill="none" />

  <!-- 3. Radiant Lighthouse Beams -->
  <path d="M256 62 L256 98" stroke="#FDE68A" stroke-width="7" stroke-linecap="round" />
  <path d="M158 108 L184 134" stroke="#FDE68A" stroke-width="6" stroke-linecap="round" opacity="0.85" />
  <path d="M354 108 L328 134" stroke="#FDE68A" stroke-width="6" stroke-linecap="round" opacity="0.85" />
  <path d="M112 205 L148 205" stroke="#FDE68A" stroke-width="6" stroke-linecap="round" opacity="0.85" />
  <path d="M400 205 L364 205" stroke="#FDE68A" stroke-width="6" stroke-linecap="round" opacity="0.85" />

  <!-- 4. The Lighthouse Guide Tower (منارة دليلك) -->
  <g>
    <!-- Top Star Beacon -->
    <path
      d="M256 98 L262 113 L276 114 L266 123 L268 137 L256 129 L244 137 L246 123 L236 114 L250 113 Z"
      fill="#FFFBEB"
    />
    <!-- Lighthouse Lantern Room Dome -->
    <path
      d="M238 138 C238 128 274 128 274 138 L279 164 L233 164 Z"
      fill="url(#dalelakGold)"
      stroke="#FFFFFF"
      stroke-width="3"
    />
    <rect x="241" y="148" width="30" height="13" rx="4" fill="#FFFBEB" />
    <!-- Lighthouse Main Tapered Body -->
    <path
      d="M233 169 L220 266 L292 266 L279 169 Z"
      fill="url(#dalelakGold)"
      stroke="#FFFFFF"
      stroke-width="4"
    />
    <rect x="246" y="190" width="20" height="23" rx="5" fill="#0F172A" />
    <rect x="243" y="228" width="26" height="28" rx="5" fill="#0F172A" />
    <line x1="225" y1="215" x2="287" y2="215" stroke="#D97706" stroke-width="5" />
  </g>

  <!-- 5. Interlocking Map Pin & Verification Checkmark Swoosh -->
  <g filter="url(#beaconGlow)">
    <path
      d="M256 92 C164 92 98 158 98 251 C98 328 184 404 256 456 C256 456 266 448 276 438"
      stroke="url(#cyanEmerald)"
      stroke-width="25"
      stroke-linecap="round"
      fill="none"
    />
    <path
      d="M123 287 C148 287 179 328 225 389 L420 174"
      stroke="url(#cyanEmerald)"
      stroke-width="28"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M133 287 C154 287 184 328 225 384 L410 184"
      stroke="url(#dalelakGold)"
      stroke-width="9"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </g>

  <!-- 6. Sharp GPS Location Pin Point -->
  <path d="M256 425 L238 456 L274 456 Z" fill="url(#dalelakGold)" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon, 'utf8');
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgIcon, 'utf8');

// Helper to create pure RGBA PNG buffer using node built-in zlib
function createPngBuffer(width, height, renderPixelFn) {
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // CRC calculation
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table & calculator
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Exact Logo Shader Function to draw pixel by pixel
function renderLogoPixel(x, y, w, h) {
  // Normalize to 512x512 coordinates
  const nx = (x / w) * 512;
  const ny = (y / h) * 512;

  // Background squircle bounds: [36, 36] to [476, 476], radius = 110
  const sqLeft = 36, sqTop = 36, sqRight = 476, sqBottom = 476, r = 110;
  
  // Signed distance to rounded rect
  const dx = Math.max(sqLeft + r - nx, 0, nx - (sqRight - r));
  const dy = Math.max(sqTop + r - ny, 0, ny - (sqBottom - r));
  const distSquircle = Math.sqrt(dx * dx + dy * dy);

  const inSquircle = (nx >= sqLeft && nx <= sqRight && ny >= sqTop && ny <= sqBottom && distSquircle <= r);

  if (!inSquircle) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Border check (white stroke 14px)
  const isBorder = (distSquircle >= r - 14) || 
                   (nx < sqLeft + 14 && dy === 0) || (nx > sqRight - 14 && dy === 0) ||
                   (ny < sqTop + 14 && dx === 0) || (ny > sqBottom - 14 && dx === 0);

  // Gradient computation for Amber [from #fbbf24 to #d97706]
  const gradT = (nx + ny) / 1024;
  let bgR = Math.round(251 * (1 - gradT) + 217 * gradT);
  let bgG = Math.round(191 * (1 - gradT) + 119 * gradT);
  let bgB = Math.round(36 * (1 - gradT) + 6 * gradT);

  if (isBorder) {
    bgR = 255; bgG = 255; bgB = 255;
  }

  // Check Emerald Verification Badge Circle at [396, 396], radius 68
  const badgeDx = nx - 396;
  const badgeDy = ny - 396;
  const badgeDist = Math.sqrt(badgeDx * badgeDx + badgeDy * badgeDy);

  if (badgeDist <= 68) {
    // Badge Border (white 14px)
    if (badgeDist >= 54) {
      return [255, 255, 255, 255];
    }
    // Emerald Gradient
    const bGradT = (badgeDx + badgeDy + 100) / 200;
    const emR = Math.round(52 * (1 - bGradT) + 5 * bGradT);
    const emG = Math.round(211 * (1 - bGradT) + 150 * bGradT);
    const emB = Math.round(153 * (1 - bGradT) + 105 * bGradT);

    // Checkmark inside badge: [374, 396] -> [390, 412] -> [422, 380]
    // Distance to line segments
    const inCheck = distToSegment(nx, ny, 374, 396, 390, 412) <= 5 ||
                    distToSegment(nx, ny, 390, 412, 422, 380) <= 5;
    if (inCheck) {
      return [255, 255, 255, 255];
    }
    return [emR, emG, emB, 255];
  }

  // Draw Map Pin icon centered in main body
  // Center is [256, 186]
  const pinCenterX = 256;
  const pinHeadCenterY = 186;
  const pinHeadRadius = 70;

  // Head circle dist
  const pHeadDist = Math.sqrt((nx - pinCenterX) ** 2 + (ny - pinHeadCenterY) ** 2);

  // Pin Inner white circle at [256, 186], radius = 28
  if (pHeadDist <= 28) {
    return [255, 255, 255, 255];
  }

  // Pin outer stroke (thickness 22)
  const isPinHeadRing = (pHeadDist <= pinHeadRadius && pHeadDist >= pinHeadRadius - 22);

  // Pin point bottom triangle to [256, 316]
  const pinPointY = 316;
  const inTriangle = ny >= pinHeadCenterY && ny <= pinPointY &&
                     Math.abs(nx - pinCenterX) <= ((pinPointY - ny) / (pinPointY - pinHeadCenterY)) * pinHeadRadius;

  const isPinEdge = inTriangle && (
    Math.abs(Math.abs(nx - pinCenterX) - ((pinPointY - ny) / (pinPointY - pinHeadCenterY)) * pinHeadRadius) <= 12
  );

  if (isPinHeadRing || isPinEdge) {
    return [255, 255, 255, 255];
  }

  if (pHeadDist < pinHeadRadius - 22 || (inTriangle && !isPinEdge)) {
    // Semi-transparent white pin fill (opacity ~ 0.25)
    return [
      Math.round(bgR * 0.75 + 255 * 0.25),
      Math.round(bgG * 0.75 + 255 * 0.25),
      Math.round(bgB * 0.75 + 255 * 0.25),
      255
    ];
  }

  return [bgR, bgG, bgB, 255];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

// Generate PNG sizes
console.log('Generating PNG icons matching logo design...');
const icon192 = createPngBuffer(192, 192, renderLogoPixel);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

const icon512 = createPngBuffer(512, 512, renderLogoPixel);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

const appleIcon = createPngBuffer(180, 180, renderLogoPixel);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

const faviconPng = createPngBuffer(64, 64, renderLogoPixel);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), faviconPng);

// 2. Create Web App Manifest
const manifest = {
  name: "دليلك — منصة تسجيل الأنشطة التجارية",
  short_name: "دليلك",
  description: "المنصة الرسمية لتسجيل وتوثيق الأنشطة التجارية على خرائط جوجل في جميع محافظات مصر.",
  start_url: "/?tab=home",
  display: "standalone",
  orientation: "portrait",
  background_color: "#0a0a12",
  theme_color: "#f59e0b",
  lang: "ar",
  dir: "rtl",
  icons: [
    {
      src: "/favicon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable"
    },
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log('All icons and manifest created successfully!');
