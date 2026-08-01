import type { Metadata } from "next";
import { PartyApp } from "./party-app";

export const metadata: Metadata = {
  title: "Midnight Reserve",
  description: "Reserve a drinks package and submit your Mobile Money payment details.",
};

export default function Home() {
  return <PartyApp />;
}
