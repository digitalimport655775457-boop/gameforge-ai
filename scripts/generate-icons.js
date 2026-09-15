import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Regular icon SVG (1:1 with rounded squircle for standalone display)
const regularSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  <rect width="512" height="512" rx="110" fill="url(#glowGrad)" />

  <!-- Outer ring border -->
  <rect x="12" y="12" width="488" height="488" rx="98" stroke="#ffffff" stroke-opacity="0.3" stroke-width="8" />

  <!-- Cosmic Star (8-pointed) -->
  <g transform="translate(256, 256) scale(2.8) translate(-50, -50)" filter="url(#starGlow)">
    <!-- Cardinal rays -->
    <path
      d="M 50 12 
         C 50 34, 62 46, 88 50 
         C 62 54, 50 66, 50 88 
         C 50 66, 38 54, 12 50 
         C 38 46, 50 34, 50 12 Z"
      fill="#FFFFFF"
    />
    <!-- Diagonal rays rotated 45 deg -->
    <path
      d="M 50 24 
         C 50 40, 58 48, 76 50 
         C 58 52, 50 60, 50 76 
         C 50 60, 42 52, 24 50 
         C 42 48, 50 40, 50 24 Z"
      transform="rotate(45 50 50)"
      fill="#E0E7FF"
      opacity="0.92"
    />
    <!-- Center bright core -->
    <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
  </g>
</svg>
`;

// 2. Maskable icon SVG (Full-bleed background without border radius, with 15% safe padding for Android adaptive icon clipping)
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <radialGradient id="glowGradMask" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <filter id="starGlowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full-bleed background for maskable adaptive clipping -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />
  <rect width="512" height="512" fill="url(#glowGradMask)" />

  <!-- Cosmic Star (scaled to fit within central 75% safe-zone) -->
  <g transform="translate(256, 256) scale(2.2) translate(-50, -50)" filter="url(#starGlowMask)">
    <!-- Cardinal rays -->
    <path
      d="M 50 12 
         C 50 34, 62 46, 88 50 
         C 62 54, 50 66, 50 88 
         C 50 66, 38 54, 12 50 
         C 38 46, 50 34, 50 12 Z"
      fill="#FFFFFF"
    />
    <!-- Diagonal rays rotated 45 deg -->
    <path
      d="M 50 24 
         C 50 40, 58 48, 76 50 
         C 58 52, 50 60, 50 76 
         C 50 60, 42 52, 24 50 
         C 42 48, 50 40, 50 24 Z"
      transform="rotate(45 50 50)"
      fill="#E0E7FF"
      opacity="0.92"
    />
    <!-- Center bright core -->
    <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
  </g>
</svg>
`;

async function run() {
  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), regularSvg.trim());

  // Generate PNG icons using sharp
  console.log('Generating 192x192 PNG...');
  await sharp(Buffer.from(regularSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating 512x512 PNG...');
  await sharp(Buffer.from(regularSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating 512x512 Maskable PNG...');
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Generating 180x180 Apple Touch Icon PNG...');
  await sharp(Buffer.from(regularSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating 64x64 favicon...');
  await sharp(Buffer.from(regularSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('All icons generated successfully in /public!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
