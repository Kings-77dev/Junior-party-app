import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("package campaign links restrict the guest menu to the requested package", async () => {
  const app = await readFile(new URL("../app/party-app.tsx", import.meta.url), "utf8");

  assert.match(app, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(app, /get\("package"\)/);
  assert.match(app, /const guestPackages = campaignPackage \? \[campaignPackage\]/);
  assert.match(app, /guestPackages\.map/);
  assert.match(app, /Reserve \$\{campaignPackage\.name\}/);
});
