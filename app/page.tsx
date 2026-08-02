import type { Metadata } from "next";
import { PartyApp } from "./party-app";
import { getChatGPTUser } from "./chatgpt-auth";

export const metadata: Metadata = {
  title: "Midnight Reserve",
  description: "Reserve a drinks package and submit your Mobile Money payment details.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <PartyApp initialUserEmail={user?.email ?? null} />;
}
