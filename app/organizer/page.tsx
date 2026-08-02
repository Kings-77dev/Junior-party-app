import type { Metadata } from "next";
import { getAccessUser } from "../access-auth";
import { PartyApp } from "../party-app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organizer Dashboard · Midnight Reserve",
  description: "Protected order, inventory, and event management.",
  robots: { index: false, follow: false },
};

export default async function OrganizerPage() {
  const user = await getAccessUser();
  return <PartyApp surface="organizer" initialUserEmail={user?.email ?? null} />;
}
