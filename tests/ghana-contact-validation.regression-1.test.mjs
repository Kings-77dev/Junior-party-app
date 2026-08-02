import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("accepts alphabetic names and exact 10-digit Ghana phone numbers", async () => {
  const [app, stateRoute] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/api/state/route.ts", root), "utf8"),
  ]);

  assert.match(app, /function cleanName/);
  assert.match(app, /function cleanGhanaPhone/);
  assert.match(app, /function isValidGhanaPhone/);
  assert.match(app, /maxLength=\{10\}/);
  assert.match(app, /pattern="0\[0-9\]\{9\}"/);
  assert.match(app, /Letters and spaces only\./);
  assert.match(stateRoute, /GHANA_PHONE_PATTERN = \/\^0\\d\{9\}\$\//);
  assert.match(stateRoute, /Phone numbers must be 10 digits and start with 0/);
});
