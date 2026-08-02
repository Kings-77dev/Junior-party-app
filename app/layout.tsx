import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "mcvyral-reserve-staging.mcvyral.workers.dev";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "SHH… It’s a Vibe! · VIP Experience";
  const description = "Reserve your drinks package for SHH… It’s a Vibe at Sky Hype Lounge, Bantama, Kumasi · Saturday 15 August 2026.";
  return {
    metadataBase: new URL(origin),
    title,
    description,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", siteName: "SHH… It’s a Vibe!", images: [{ url: `${origin}/og-vibe.png`, width: 1200, height: 630, alt: "SHH… It’s a Vibe VIP Experience at Sky Hype Lounge" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og-vibe.png`] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
