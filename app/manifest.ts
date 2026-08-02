import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VYRAL Entertainment",
    short_name: "VYRAL",
    description: "Discover VYRAL events, reserve VIP drinks packages, and submit Mobile Money payment details securely.",
    start_url: "/",
    display: "standalone",
    background_color: "#090a0b",
    theme_color: "#090a0b",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
