import type { Metadata } from "next";
import { PartyApp } from "./party-app";

export const metadata: Metadata = {
  title: "VYRAL Entertainment | Events & VIP Reservations",
  description: "Discover VYRAL events, reserve VIP drinks packages, and submit Mobile Money payment details securely.",
};

export default function Home() {
  return <PartyApp surface="guest" />;
}
