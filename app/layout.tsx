import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "mcvyral-reserve-staging.mcvyral.workers.dev";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "VYRAL Entertainment | Events & VIP Reservations";
  const description = "Discover VYRAL events, reserve VIP drinks packages, and submit Mobile Money payment details securely.";
  return {
    metadataBase: new URL(origin),
    title,
    description,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", siteName: "VYRAL Entertainment", images: [{ url: `${origin}/og-vyral.png`, width: 1200, height: 630, alt: "VYRAL Entertainment — Events, Experiences & Reservations" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og-vyral.png`] },
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
