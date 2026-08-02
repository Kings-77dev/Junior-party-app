import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("contains the complete guest and organizer product flows", async () => {
  const [app, layout, css, hosting, stateRoute, uploadRoute, data] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL(".openai/hosting.json", root), "utf8"),
    readFile(new URL("app/api/state/route.ts", root), "utf8"),
    readFile(new URL("app/api/upload/route.ts", root), "utf8"),
    readFile(new URL("app/data.ts", root), "utf8"),
  ]);

  assert.match(app, /Your night/);
  assert.match(app, /Pay with Mobile Money/);
  assert.match(app, /Awaiting verification/);
  assert.match(app, /Confirm payment/);
  assert.match(app, /Drinks packages/);
  assert.match(app, /Payment destinations/);
  const organizerAuthorization = `${app}\n${stateRoute}\n${uploadRoute}\n${data}`;
  assert.match(organizerAuthorization, /freshfaya6@yahoo\.com/);
  assert.doesNotMatch(organizerAuthorization, /samueladjei162@gmail\.com/);
  assert.match(data, /configVersion: 2/);
  assert.match(stateRoute, /config\.configVersion \?\? 0/);
  assert.match(stateRoute, /whatsapp: defaultState\.event\.whatsapp/);
  assert.match(stateRoute, /paymentDestinations: defaultState\.paymentDestinations/);
  assert.match(app, /signin-with-chatgpt\?return_to=\/organizer/);
  assert.doesNotMatch(app, /signin-with-chatgpt\?return_to=\/"/);
  assert.match(layout, /Midnight Reserve/);
  assert.match(layout, /og\.png/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "UPLOADS"/);
  assert.doesNotMatch(app, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});
