import QRCode from "qrcode";
import sharp from "sharp";

const reservationUrl = "https://mcvyral-reserve-staging.mcvyral.workers.dev/?utm_source=social&utm_campaign=general";
const width = 1080;
const height = 1350;

const qr = await QRCode.toBuffer(reservationUrl, {
  type: "png",
  errorCorrectionLevel: "H",
  width: 720,
  margin: 4,
  color: { dark: "#0B1D24", light: "#FFFFFF" },
});

const logo = await sharp("design/vyral-logo.png")
  .extract({ left: 170, top: 350, width: 740, height: 390 })
  .resize({ width: 430 })
  .png()
  .toBuffer();

const card = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="28%" r="72%">
      <stop stop-color="#12D7EB" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#12D7EB" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1350" fill="#17262D"/>
  <rect width="1080" height="1350" fill="url(#glow)"/>
  <text x="540" y="350" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica Neue, Arial, sans-serif" font-size="62" font-weight="700" letter-spacing="3">VYRAL RESERVATIONS</text>
  <text x="540" y="404" text-anchor="middle" fill="#9DB1B6" font-family="Helvetica Neue, Arial, sans-serif" font-size="24" letter-spacing="5">SCAN TO EXPLORE PACKAGES</text>
  <rect x="140" y="452" width="800" height="800" rx="48" fill="#FFFFFF"/>
  <text x="540" y="1307" text-anchor="middle" fill="#12D7EB" font-family="Helvetica Neue, Arial, sans-serif" font-size="22" font-weight="600" letter-spacing="3">LIVE AVAILABILITY · MOBILE MONEY</text>
</svg>`);

await sharp({ create: { width, height, channels: 4, background: "#17262D" } })
  .composite([
    { input: card },
    { input: logo, left: 325, top: 72 },
    { input: qr, left: 180, top: 492 },
  ])
  .png({ compressionLevel: 9 })
  .toFile("public/vyral-reserve-social.png");

await sharp(qr)
  .resize({ width: 1080, height: 1080, fit: "contain", background: "#FFFFFF" })
  .png({ compressionLevel: 9 })
  .toFile("public/vyral-reserve-qr.png");

console.log(`General QR: ${reservationUrl}`);
