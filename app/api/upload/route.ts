import { env } from "cloudflare:workers";

const ORGANIZER = "samueladjei162@gmail.com";

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;
  const email = request.headers.get("cf-access-authenticated-user-email")?.toLowerCase();
  if (!pathname.startsWith("/api/organizer/") || email !== ORGANIZER) return new Response("Organizer access required", { status: 403 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !key.startsWith("payment-proof/")) return new Response("Not found", { status: 404 });
  const object = await env.UPLOADS.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": object.httpMetadata?.contentType ?? "application/octet-stream", "cache-control": "private, max-age=60" } });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Screenshot is required" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Screenshot must be 10 MB or smaller" }, { status: 413 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Response.json({ error: "Use a JPEG, PNG, or WebP image" }, { status: 415 });
  }
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `payment-proof/${crypto.randomUUID()}.${extension}`;
  await env.UPLOADS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ key });
}
