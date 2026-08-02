import type { Metadata } from "next";
import { PartyApp } from "./party-app";

export const metadata: Metadata = {
  title: "SHH… It’s a Vibe! · VIP Experience",
  description: "Reserve your drinks package for SHH… It’s a Vibe at Sky Hype Lounge, Bantama, Kumasi · Saturday 15 August 2026.",
};

export default function Home() {
  return <PartyApp surface="guest" />;
}
