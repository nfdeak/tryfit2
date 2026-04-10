// Run with: node scripts/generate-icons.js
// Requires: npm install canvas (or use sharp)
// Simple fallback: creates placeholder PNG files using pure Node.js Buffer tricks
// For production, replace with real icons generated from a design tool.

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 512];
const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Minimal valid 1x1 orange PNG (base64) as placeholder
// Real icons should be created from a proper design asset
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';

sizes.forEach(size => {
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  if (!fs.existsSync(outPath)) {
    fs.writeFileSync(outPath, Buffer.from(TINY_PNG_BASE64, 'base64'));
    console.log(`Created placeholder: icon-${size}.png`);
  } else {
    console.log(`Exists: icon-${size}.png`);
  }
});

console.log('\nPlaceholder icons created. Replace with real artwork before deploying.');
