import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

// Regression: routine and destructive package actions were always shown together.
test("package cards separate view, edit, save, and destructive states", async () => {
  const [app, css, data, stateRoute] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("app/data.ts", root), "utf8"),
    readFile(new URL("app/api/state/route.ts", root), "utf8"),
  ]);

  assert.match(app, /Edit package/);
  assert.match(app, /Save changes/);
  assert.match(app, /disabled=\{!dirty \|\| saving\}/);
  assert.match(app, /Mark \$\{draft\.name\} as sold out\?/);
  assert.match(app, /pkg\.canDelete \?/);
  assert.match(app, /if \(!response\.ok\) throw new Error\(payload\.error/);
  assert.match(app, /if \(payload\.state\) setData\(payload\.state\)/);
  assert.match(data, /canDelete\?: boolean/);
  assert.match(stateRoute, /packageIdsWithOrders/);
  assert.match(css, /min-height: 44px/);
});

test("organizers can upload, replace, and remove package images shown to guests", async () => {
  const [app, data, stateRoute, uploadRoute, organizerUpload, css, migration] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/data.ts", root), "utf8"),
    readFile(new URL("app/api/state/route.ts", root), "utf8"),
    readFile(new URL("app/api/upload/route.ts", root), "utf8"),
    readFile(new URL("app/api/organizer/upload/route.ts", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("drizzle/0002_package_images.sql", root), "utf8"),
  ]);

  assert.match(data, /imageKey\?: string \| null/);
  assert.match(app, /Add custom image/);
  assert.match(app, /Replace image/);
  assert.match(app, /Remove image/);
  assert.match(app, /form\.set\("kind", "package-image"\)/);
  assert.match(app, /packageImageUrl\(pkg\.imageKey\)/);
  assert.match(uploadRoute, /package-image\//);
  assert.match(uploadRoute, /Organizer access required/);
  assert.match(organizerUpload, /DELETE, GET, POST/);
  assert.match(stateRoute, /image_key/);
  assert.match(stateRoute, /UPLOADS\.delete/);
  assert.match(migration, /ADD `image_key` text/);
  assert.match(css, /object-fit: cover/);
});
