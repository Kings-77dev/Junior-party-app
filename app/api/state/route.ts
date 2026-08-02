import { env } from "cloudflare:workers";
import { defaultState, type AppState, type Order, type OrderStatus, type Package } from "../../data";

const ORGANIZER = "freshfaya6@yahoo.com";
const NAME_PATTERN = /^\p{L}+(?: \p{L}+)*$/u;
const GHANA_PHONE_PATTERN = /^0\d{9}$/;
type D1 = NonNullable<typeof env.DB>;

function db(): D1 {
  if (!env.DB) throw new Error("Database unavailable");
  return env.DB;
}

async function ensureSchema() {
  const d1 = db();
  await d1.batch([
    d1.prepare("CREATE TABLE IF NOT EXISTS app_config (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    d1.prepare("CREATE TABLE IF NOT EXISTS packages (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, price INTEGER NOT NULL, capacity INTEGER NOT NULL, reserved INTEGER NOT NULL DEFAULT 0, paid INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, initials TEXT NOT NULL)"),
    d1.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY NOT NULL, guest_name TEXT NOT NULL, guest_phone TEXT NOT NULL, package_id TEXT NOT NULL, package_name TEXT NOT NULL, amount INTEGER NOT NULL, network TEXT NOT NULL, transaction_id TEXT NOT NULL, payer_name TEXT NOT NULL, sender_phone TEXT NOT NULL, status TEXT NOT NULL, submitted_at TEXT NOT NULL, note TEXT, screenshot_key TEXT, updated_at TEXT NOT NULL)"),
    d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS orders_transaction_id_unique ON orders(transaction_id)"),
    d1.prepare("CREATE TABLE IF NOT EXISTS inventory_holds (id TEXT PRIMARY KEY NOT NULL, package_id TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS inventory_holds_expiry_idx ON inventory_holds(expires_at)"),
    d1.prepare("CREATE TABLE IF NOT EXISTS activity_log (id TEXT PRIMARY KEY NOT NULL, actor_email TEXT NOT NULL, action TEXT NOT NULL, order_id TEXT, details TEXT, created_at TEXT NOT NULL)"),
  ]);
  const count = await d1.prepare("SELECT COUNT(*) AS count FROM packages").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;
  const legacy = await d1.prepare("SELECT data FROM app_state WHERE id = 'main'").first<{ data: string }>().catch(() => null);
  const state = legacy?.data ? JSON.parse(legacy.data) as AppState : defaultState;
  const config = { catalogVersion: state.catalogVersion, configVersion: state.configVersion, organizerEmails: state.organizerEmails, event: state.event, paymentDestinations: state.paymentDestinations };
  const statements = [d1.prepare("INSERT OR REPLACE INTO app_config (id,data,updated_at) VALUES ('main',?,?)").bind(JSON.stringify(config), new Date().toISOString())];
  for (const p of state.packages) statements.push(d1.prepare("INSERT OR REPLACE INTO packages (id,name,description,price,capacity,reserved,paid,active,initials) VALUES (?,?,?,?,?,?,?,?,?)").bind(p.id,p.name,p.description,p.price,p.capacity,p.reserved,p.paid,p.active?1:0,p.initials));
  for (const o of state.orders) statements.push(d1.prepare("INSERT OR IGNORE INTO orders (id,guest_name,guest_phone,package_id,package_name,amount,network,transaction_id,payer_name,sender_phone,status,submitted_at,note,screenshot_key,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(o.id,o.guestName,o.guestPhone,o.packageId,o.packageName,o.amount,o.network,o.transactionId,o.payerName,o.senderPhone,o.status,o.submittedAt,o.note??null,o.screenshotKey??null,new Date().toISOString()));
  await d1.batch(statements);
}

async function cleanupExpired() {
  const d1 = db();
  const expired = await d1.prepare("SELECT id, package_id FROM inventory_holds WHERE expires_at <= ?").bind(Date.now()).all<{ id: string; package_id: string }>();
  for (const hold of expired.results) await d1.batch([
    d1.prepare("DELETE FROM inventory_holds WHERE id = ?").bind(hold.id),
    d1.prepare("UPDATE packages SET reserved = MAX(0,reserved-1) WHERE id = ?").bind(hold.package_id),
  ]);
}

async function loadState(): Promise<AppState> {
  await ensureSchema();
  await cleanupExpired();
  const d1 = db();
  const cfg = await d1.prepare("SELECT data FROM app_config WHERE id='main'").first<{ data: string }>();
  const pRows = await d1.prepare("SELECT * FROM packages ORDER BY rowid").all<Record<string, unknown>>();
  const oRows = await d1.prepare("SELECT * FROM orders ORDER BY rowid DESC").all<Record<string, unknown>>();
  const hRows = await d1.prepare("SELECT id,package_id,expires_at FROM inventory_holds").all<{id:string;package_id:string;expires_at:number}>();
  const packageIdsWithOrders = new Set(oRows.results.map((row) => String(row.package_id)));
  let config = cfg?.data ? JSON.parse(cfg.data) as Partial<AppState> : defaultState;
  if ((config.configVersion ?? 0) < (defaultState.configVersion ?? 0)) {
    config = {
      ...config,
      configVersion: defaultState.configVersion,
      organizerEmails: [ORGANIZER],
      event: { ...defaultState.event, ...config.event, whatsapp: defaultState.event.whatsapp },
      paymentDestinations: defaultState.paymentDestinations,
    };
    await d1.prepare("INSERT OR REPLACE INTO app_config (id,data,updated_at) VALUES ('main',?,?)").bind(JSON.stringify(config),new Date().toISOString()).run();
  }
  return {
    ...defaultState, ...config,
    packages: pRows.results.map((r) => ({ id:r.id,name:r.name,description:r.description,price:r.price,capacity:r.capacity,reserved:r.reserved,paid:r.paid,active:!!r.active,initials:r.initials,canDelete:Number(r.reserved)===0&&Number(r.paid)===0&&!packageIdsWithOrders.has(String(r.id)) } as Package)),
    orders: oRows.results.map((r) => ({ id:r.id,guestName:r.guest_name,guestPhone:r.guest_phone,packageId:r.package_id,packageName:r.package_name,amount:r.amount,network:String(r.network),transactionId:r.transaction_id,payerName:r.payer_name,senderPhone:r.sender_phone,status:r.status as OrderStatus,submittedAt:r.submitted_at,note:r.note,screenshotKey:r.screenshot_key } as Order)),
    holds: hRows.results.map((r) => ({ id:r.id,packageId:r.package_id,expiresAt:r.expires_at })),
  };
}

function organizerEmail(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase() ?? null;
  return email === ORGANIZER ? email : null;
}

function publicState(state: AppState): AppState {
  return { ...state, organizerEmails: [], orders: [] };
}

export async function GET(request: Request) {
  try { const state=await loadState(); return Response.json({ state: organizerEmail(request) ? state : publicState(state) }); }
  catch (error) { return Response.json({ state: defaultState, warning: error instanceof Error ? error.message : "Storage unavailable" }); }
}

export async function POST(request: Request) {
  try {
    await ensureSchema(); await cleanupExpired();
    const d1 = db();
    const body = await request.json() as Record<string, any>;
    if (body.action === "hold") {
      const pkg = await d1.prepare("SELECT capacity,reserved,paid FROM packages WHERE id=? AND active=1").bind(body.packageId).first<{capacity:number;reserved:number;paid:number}>();
      if (!pkg || pkg.capacity-pkg.reserved-pkg.paid <= 0) return Response.json({ error:"Package is sold out" },{status:409});
      await d1.batch([d1.prepare("INSERT INTO inventory_holds (id,package_id,expires_at,created_at) VALUES (?,?,?,?)").bind(body.holdId,body.packageId,body.expiresAt,new Date().toISOString()),d1.prepare("UPDATE packages SET reserved=reserved+1 WHERE id=?").bind(body.packageId)]);
    } else if (body.action === "release") {
      const hold = await d1.prepare("SELECT package_id FROM inventory_holds WHERE id=?").bind(body.holdId).first<{package_id:string}>();
      if (hold) await d1.batch([d1.prepare("DELETE FROM inventory_holds WHERE id=?").bind(body.holdId),d1.prepare("UPDATE packages SET reserved=MAX(0,reserved-1) WHERE id=?").bind(hold.package_id)]);
    } else if (body.action === "submit") {
      const o = body.order as Order;
      if (!NAME_PATTERN.test(o.guestName.trim()) || !NAME_PATTERN.test(o.payerName.trim())) return Response.json({error:"Names must contain letters and spaces only"},{status:400});
      if (!GHANA_PHONE_PATTERN.test(o.guestPhone) || !GHANA_PHONE_PATTERN.test(o.senderPhone)) return Response.json({error:"Phone numbers must be 10 digits and start with 0"},{status:400});
      const duplicate = await d1.prepare("SELECT id FROM orders WHERE transaction_id=?").bind(o.transactionId).first();
      if (duplicate) return Response.json({ error:"This transaction ID has already been submitted" },{status:409});
      const hold = await d1.prepare("SELECT package_id,expires_at FROM inventory_holds WHERE id=?").bind(body.holdId).first<{package_id:string;expires_at:number}>();
      if (!hold || hold.expires_at <= Date.now() || hold.package_id !== o.packageId) return Response.json({ error:"Reservation expired. Please select the package again." },{status:409});
      await d1.batch([d1.prepare("INSERT INTO orders (id,guest_name,guest_phone,package_id,package_name,amount,network,transaction_id,payer_name,sender_phone,status,submitted_at,note,screenshot_key,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(o.id,o.guestName,o.guestPhone,o.packageId,o.packageName,o.amount,o.network,o.transactionId,o.payerName,o.senderPhone,"awaiting",o.submittedAt,null,body.screenshotKey??null,new Date().toISOString()),d1.prepare("DELETE FROM inventory_holds WHERE id=?").bind(body.holdId)]);
    } else if (body.action === "order-status") {
      const actor = organizerEmail(request); if (!actor) return Response.json({error:"Organizer access required"},{status:403});
      const order = await d1.prepare("SELECT package_id,status FROM orders WHERE id=?").bind(body.orderId).first<{package_id:string;status:string}>();
      if (!order) return Response.json({error:"Order not found"},{status:404});
      if (!["awaiting","resubmit"].includes(order.status)) return Response.json({error:"Order was already processed"},{status:409});
      const note = typeof body.note === "string" ? body.note.trim().slice(0,500) : null;
      const statements = [d1.prepare("UPDATE orders SET status=?,note=?,updated_at=? WHERE id=? AND status IN ('awaiting','resubmit')").bind(body.status,note,new Date().toISOString(),body.orderId),d1.prepare("INSERT INTO activity_log (id,actor_email,action,order_id,details,created_at) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),actor,`order.${body.status}`,body.orderId,note ? JSON.stringify({note}) : null,new Date().toISOString())];
      if (["paid","unverified","cancelled"].includes(body.status)) statements.push(d1.prepare("UPDATE packages SET reserved=MAX(0,reserved-1),paid=paid+? WHERE id=?").bind(body.status==="paid"?1:0,order.package_id));
      await d1.batch(statements);
    } else if (body.action === "delete-package") {
      const actor = organizerEmail(request); if (!actor) return Response.json({error:"Organizer access required"},{status:403});
      const pkg = await d1.prepare("SELECT name,reserved,paid FROM packages WHERE id=?").bind(body.packageId).first<{name:string;reserved:number;paid:number}>();
      if (!pkg) return Response.json({error:"Package not found"},{status:404});
      const order = await d1.prepare("SELECT id FROM orders WHERE package_id=? LIMIT 1").bind(body.packageId).first();
      if (pkg.reserved > 0 || pkg.paid > 0 || order) return Response.json({error:"This package has reservations or order history. Hide it instead."},{status:409});
      await d1.batch([
        d1.prepare("DELETE FROM packages WHERE id=?").bind(body.packageId),
        d1.prepare("INSERT INTO activity_log (id,actor_email,action,details,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(),actor,"package.delete",JSON.stringify({packageId:body.packageId,name:pkg.name}),new Date().toISOString()),
      ]);
    } else return Response.json({error:"Unknown action"},{status:400});
    const state=await loadState();
    return Response.json({ state: organizerEmail(request) ? state : publicState(state) });
  } catch (error) { return Response.json({ error:error instanceof Error?error.message:"Action failed" },{status:500}); }
}

export async function PUT(request: Request) {
  const actor = organizerEmail(request); if (!actor) return Response.json({error:"Organizer access required"},{status:403});
  try {
    await ensureSchema(); const d1=db(); const payload=await request.json() as {state?:AppState}; const state=payload.state;
    if (!state) return Response.json({error:"Invalid state"},{status:400});
    const config={catalogVersion:state.catalogVersion,configVersion:state.configVersion,organizerEmails:[ORGANIZER],event:state.event,paymentDestinations:state.paymentDestinations};
    const statements=[d1.prepare("INSERT OR REPLACE INTO app_config (id,data,updated_at) VALUES ('main',?,?)").bind(JSON.stringify(config),new Date().toISOString())];
    for(const p of state.packages) statements.push(d1.prepare("INSERT INTO packages (id,name,description,price,capacity,reserved,paid,active,initials) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,price=excluded.price,capacity=MAX(excluded.capacity,packages.reserved+packages.paid),active=excluded.active,initials=excluded.initials").bind(p.id,p.name,p.description,p.price,p.capacity,p.reserved,p.paid,p.active?1:0,p.initials));
    statements.push(d1.prepare("INSERT INTO activity_log (id,actor_email,action,details,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(),actor,"settings.update",null,new Date().toISOString()));
    await d1.batch(statements); return Response.json({state:await loadState()});
  } catch(error){return Response.json({error:error instanceof Error?error.message:"Could not save"},{status:500});}
}
