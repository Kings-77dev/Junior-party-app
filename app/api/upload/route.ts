import { env } from "cloudflare:workers";

type UploadBucket = {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
};

export async function GET(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase();
  if (email !== "samueladjei162@gmail.com") return new Response("Organizer access required", { status: 403 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !key.startsWith("payment-proof/")) return new Response("Not found", { status: 404 });
  const bucket = (env as unknown as { UPLOADS?: UploadBucket }).UPLOADS;
  const object = bucket ? await bucket.get(key) : null;
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": object.httpMetadata?.contentType ?? "application/octet-stream", "cache-control": "private, max-age=60" } });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Screenshot is required" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "Screenshot must be 5 MB or smaller" }, { status: 413 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Response.json({ error: "Use a JPEG, PNG, or WebP image" }, { status: 415 });
  }
  const bucket = (env as unknown as { UPLOADS?: UploadBucket }).UPLOADS;
  if (!bucket) {
    return Response.json({ key: null, warning: "Upload storage is not available in this preview" });
  }
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `payment-proof/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ key });
}
