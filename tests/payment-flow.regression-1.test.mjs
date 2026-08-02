import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

// Regression: ISSUE-001 — oversized payment screenshots failed silently
// Found by /qa on 2026-08-02
// Report: .gstack/qa-reports/qa-report-midnight-reserve-gh-2026-08-02.md
test("prepares screenshots up to 10 MB and reports upload failures", async () => {
  const [app, upload] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/api/upload/route.ts", root), "utf8"),
  ]);

  assert.match(app, /MAX_PROOF_SELECTION_BYTES = 10 \* 1024 \* 1024/);
  assert.match(app, /MAX_PROOF_UPLOAD_BYTES = 850 \* 1024/);
  assert.match(app, /prepareProofImage/);
  assert.match(app, /if \(!upload\.ok\) throw new Error/);
  assert.match(app, /Preparing and submitting/);
  assert.match(upload, /file\.size > 10 \* 1024 \* 1024/);
});

test("shows the organizer contact after package selection and order submission", async () => {
  const [app, data, css] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/data.ts", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(data, /Samuel Adjei Kyereh/);
  assert.match(app, /Need help with this payment\?/);
  assert.match(app, /Ask organizer on WhatsApp/);
  assert.match(app, /WhatsApp organizer · \{data\.event\.whatsapp\}/);
  assert.match(app, /233\$\{digits\.slice\(1\)\}/);
  assert.match(css, /\.payment-actions \{[^}]*gap: 18px/);
  assert.match(css, /\.pay-page \.flow-alert\.warning \{[^}]*margin-bottom: 18px/);
  assert.match(css, /\.payment-help-option \{[^}]*padding-top: 16px/);
});

// Regression: organizer-created packages could not be removed and appeared last.
test("lets organizers delete unused packages and keeps new packages first", async () => {
  const [app, stateRoute] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/api/state/route.ts", root), "utf8"),
  ]);

  assert.match(app, /packages: \[pkg, \.\.\.data\.packages\]/);
  assert.match(app, /b\.id\.localeCompare\(a\.id\)/);
  assert.match(app, /Delete \$\{pkg\.name\}\?/);
  assert.match(app, /action: "delete-package"/);
  assert.match(stateRoute, /body\.action === "delete-package"/);
  assert.match(stateRoute, /This package has reservations or order history\. Hide it instead\./);
  assert.match(stateRoute, /DELETE FROM packages WHERE id=\?/);
});
