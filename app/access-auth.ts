import { headers } from "next/headers";

export const APPROVED_ORGANIZER_EMAIL = "samueladjei162@gmail.com";

export type AccessUser = {
  displayName: string;
  email: string;
};

export async function getAccessUser(): Promise<AccessUser | null> {
  const requestHeaders = await headers();
  const email = requestHeaders.get("cf-access-authenticated-user-email")?.trim().toLowerCase();
  if (email !== APPROVED_ORGANIZER_EMAIL) return null;

  return { displayName: email, email };
}
