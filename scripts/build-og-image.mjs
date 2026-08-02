import sharp from "sharp";

const width = 1200;
const height = 630;
const logo = await sharp("design/vyral-logo.png")
  .resize({ width: 510, height: 510, fit: "cover" })
  .png()
  .toBuffer();

const artwork = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(928 184) rotate(123) scale(570 650)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#13D6EA" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#13D6EA" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="#12D7EB"/>
      <stop offset="1" stop-color="#12D7EB" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#17262D"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <path d="M640 88V542" stroke="#EAF6F7" stroke-opacity="0.12"/>
  <rect x="696" y="160" width="86" height="4" rx="2" fill="url(#line)"/>
  <text x="696" y="242" fill="#F4F8F9" font-family="Helvetica Neue, Arial, sans-serif" font-size="48" font-weight="700" letter-spacing="1">EVENTS</text>
  <text x="696" y="311" fill="#F4F8F9" font-family="Helvetica Neue, Arial, sans-serif" font-size="48" font-weight="700" letter-spacing="1">EXPERIENCES</text>
  <text x="696" y="380" fill="#F4F8F9" font-family="Helvetica Neue, Arial, sans-serif" font-size="48" font-weight="700" letter-spacing="1">RESERVATIONS</text>
  <text x="699" y="449" fill="#9DB1B6" font-family="Helvetica Neue, Arial, sans-serif" font-size="21" letter-spacing="2">DISCOVER · RESERVE · EXPERIENCE</text>
  <circle cx="1118" cy="78" r="5" fill="#12D7EB"/>
  <path d="M1138 78H1200" stroke="#12D7EB" stroke-opacity="0.6"/>
</svg>`);

await sharp({
  create: { width, height, channels: 4, background: "#17262d" },
})
  .composite([
    { input: artwork },
    { input: logo, left: 70, top: 60 },
  ])
  .png({ compressionLevel: 9, palette: true })
  .toFile("public/og-vyral.png");
