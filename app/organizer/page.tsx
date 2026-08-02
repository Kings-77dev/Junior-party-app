import type { Metadata } from "next";
import { getChatGPTUser } from "../chatgpt-auth";
import { PartyApp } from "../party-app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organizer Dashboard · Midnight Reserve",
  description: "Protected order, inventory, and event management.",
  robots: { index: false, follow: false },
};

export default async function OrganizerPage() {
  const user = await getChatGPTUser();
  return <PartyApp surface="organizer" initialUserEmail={user?.email ?? null} />;
}
