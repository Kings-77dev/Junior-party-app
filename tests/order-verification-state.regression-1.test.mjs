import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("shows payment decisions only for a selected awaiting order", async () => {
  const [app, stateRoute, css] = await Promise.all([
    readFile(new URL("app/party-app.tsx", root), "utf8"),
    readFile(new URL("app/api/state/route.ts", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(app, /useState\(""\).*selectedOrderId|selectedOrderId, setSelectedOrderId\] = useState\(""\)/s);
  assert.match(app, /data\.orders\.find\(\(order\) => order\.id === selectedOrderId\);/);
  assert.match(app, /selectedOrder\.status === "awaiting"/);
  assert.match(app, /Waiting for the guest to send corrected payment details/);
  assert.match(app, /value=\{verificationNote\}/);
  assert.match(stateRoute, /UPDATE orders SET status=\?,note=\?,updated_at=\?/);
  assert.match(css, /\.verification-actions \.cancel \{ min-height: 44px/);
});
