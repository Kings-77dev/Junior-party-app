import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { appState } from "../../../db/schema";
import { defaultState, type AppState } from "../../data";

async function ensureState() {
  const db = getDb();
  await db.run(
    `CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  );
  const [row] = await db.select().from(appState).where(eq(appState.id, "main")).limit(1);
  if (!row) {
    await db.insert(appState).values({ id: "main", data: JSON.stringify(defaultState) });
    return defaultState;
  }
  return JSON.parse(row.data) as AppState;
}

export async function GET() {
  try {
    return Response.json({ state: await ensureState() });
  } catch (error) {
    return Response.json(
      { state: defaultState, warning: error instanceof Error ? error.message : "Storage unavailable" },
      { status: 200 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { state?: AppState };
    if (!payload.state || !Array.isArray(payload.state.packages) || !Array.isArray(payload.state.orders)) {
      return Response.json({ error: "Invalid state" }, { status: 400 });
    }
    if (JSON.stringify(payload.state).length > 500_000) {
      return Response.json({ error: "State is too large" }, { status: 413 });
    }
    await ensureState();
    const db = getDb();
    await db
      .update(appState)
      .set({ data: JSON.stringify(payload.state), updatedAt: new Date().toISOString() })
      .where(eq(appState.id, "main"));
    return Response.json({ state: payload.state });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save" },
      { status: 500 },
    );
  }
}
