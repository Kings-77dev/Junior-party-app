/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

type RuntimeEnv = Omit<Env, "APP_SURFACE" | "ADMIN_ENABLED"> & {
  APP_SURFACE: "guest" | "organizer";
  ADMIN_ENABLED?: "true" | "false";
};

const worker: ExportedHandler<RuntimeEnv> = {
  async fetch(request: Request, env: RuntimeEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const organizerRoute = url.pathname === "/organizer" || url.pathname.startsWith("/api/organizer/");

    if (env.APP_SURFACE === "guest" && organizerRoute) {
      return new Response("Not found", { status: 404 });
    }

    if (env.APP_SURFACE === "organizer") {
      if (env.ADMIN_ENABLED !== "true") {
        return new Response("Organizer access is being secured. Please try again shortly.", {
          status: 503,
          headers: { "cache-control": "no-store" },
        });
      }
      if (url.pathname === "/") return Response.redirect(new URL("/organizer", url), 302);
      const organizerAsset = url.pathname.startsWith("/assets/")
        || ["/favicon.svg", "/og.png", "/file.svg", "/globe.svg", "/window.svg"].includes(url.pathname);
      if (!organizerRoute && !organizerAsset && url.pathname !== "/_vinext/image") {
        return new Response("Not found", { status: 404 });
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({
            format: format as ImageOutputOptions["format"],
            quality,
          });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
