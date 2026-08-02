import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SHH… It’s a Vibe! · VIP Experience",
    short_name: "SHH… Vibe",
    description: "Reserve a drinks package for SHH… It’s a Vibe at Sky Hype Lounge.",
    start_url: "/",
    display: "standalone",
    background_color: "#090a0b",
    theme_color: "#090a0b",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
