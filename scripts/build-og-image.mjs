import sharp from "sharp";

const width = 1200;
const height = 630;
const overlay = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#050403" stop-opacity="0.64"/>
      <stop offset="0.52" stop-color="#050403" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#050403" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <text x="72" y="88" fill="#d8b56c" font-family="Helvetica Neue, Arial, sans-serif" font-size="18" font-weight="600" letter-spacing="7">PRIVATE INVITATION</text>
  <line x1="72" y1="116" x2="270" y2="116" stroke="#8f6c35" stroke-width="2"/>
  <text x="68" y="238" fill="#e5c98c" font-family="Didot, Georgia, serif" font-size="86" letter-spacing="3">SHH…</text>
  <text x="68" y="326" fill="#f0dba9" font-family="Didot, Georgia, serif" font-size="78" letter-spacing="2">IT&apos;S A VIBE</text>
  <text x="73" y="371" fill="#b88f50" font-family="Helvetica Neue, Arial, sans-serif" font-size="19" font-weight="600" letter-spacing="8">VIP EXPERIENCE</text>
  <text x="72" y="492" fill="#f7ead0" font-family="Helvetica Neue, Arial, sans-serif" font-size="25" font-weight="600">Saturday 15 August 2026 · 9 PM till late</text>
  <text x="72" y="534" fill="#c8b99e" font-family="Helvetica Neue, Arial, sans-serif" font-size="22">Sky Hype Lounge · Bantama, Kumasi</text>
  <text x="72" y="585" fill="#9d7d49" font-family="Helvetica Neue, Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="3">RESERVE YOUR DRINKS PACKAGE</text>
</svg>`);

await sharp("design/og-vibe-background.png")
  .resize(width, height, { fit: "cover", position: "center" })
  .composite([{ input: overlay }])
  .png({ compressionLevel: 9, palette: true })
  .toFile("public/og-vibe.png");
