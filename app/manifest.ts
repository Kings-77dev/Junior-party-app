import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Midnight Reserve",
    short_name: "Reserve",
    description: "Party drinks reservations and Mobile Money verification.",
    start_url: "/",
    display: "standalone",
    background_color: "#090a0b",
    theme_color: "#090a0b",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
