"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { defaultState, packageCatalog, type AppState, type Order, type OrderStatus, type Package } from "./data";

type GuestStep = "landing" | "details" | "packages" | "pay" | "proof" | "status";
type AdminTab = "orders" | "packages" | "settings";
type OrderFilter = "review" | "all";

const guestSteps: GuestStep[] = ["details", "packages", "pay", "proof", "status"];

function money(value: number) {
  return `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(value)}`;
}

function remaining(pkg: Package) {
  return Math.max(0, pkg.capacity - pkg.reserved - pkg.paid);
}

function makeOrderCode() {
  return `SHH-${Math.floor(1000 + Math.random() * 9000)}`;
}

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    reserved: "Held",
    awaiting: "Awaiting verification",
    paid: "Confirmed",
    unverified: "Couldn’t verify",
    resubmit: "Resubmit requested",
    cancelled: "Cancelled",
    expired: "Expired",
  };
  return labels[status];
}

function migratePackageCatalog(state: AppState): AppState {
  let next = state;
  if ((state.catalogVersion ?? 0) < 2) {
    next = {
      ...next,
      catalogVersion: 2,
      packages: packageCatalog.map((actualPackage, index) => {
        const existing = state.packages[index];
        if (!existing) return actualPackage;
        return { ...actualPackage, capacity: existing.capacity, reserved: existing.reserved, paid: existing.paid, active: existing.active };
      }),
    };
  }
  if ((state.configVersion ?? 0) < 3) {
    next = {
      ...next,
      configVersion: 3,
      organizerEmails: ["freshfaya6@yahoo.com"],
      event: { ...next.event, whatsapp: "0557788343" },
      paymentDestinations: defaultState.paymentDestinations,
    };
  }
  return next;
}

export function PartyApp({ initialUserEmail = null, surface = "guest" }: { initialUserEmail?: string | null; surface?: "guest" | "organizer" }) {
  const [data, setData] = useState<AppState>(defaultState);
  const [guestStep, setGuestStep] = useState<GuestStep>("landing");
  const [adminTab, setAdminTab] = useState<AdminTab>("orders");
  const organizerAllowed = initialUserEmail?.toLowerCase() === "freshfaya6@yahoo.com";
  const [signedIn, setSignedIn] = useState(organizerAllowed);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("gold");
  const [heldPackageId, setHeldPackageId] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [clock, setClock] = useState(Date.now());
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [destinationId, setDestinationId] = useState("mtn-primary");
  const [transactionId, setTransactionId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState("MR-A7K9");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("review");
  const [query, setQuery] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/state")
      .then((response) => response.json())
      .then((payload: { state?: AppState }) => {
        if (!payload.state) return;
        const next = migratePackageCatalog(payload.state);
        setData(next);
        if (next !== payload.state) {
          fetch("/api/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: next }) }).catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!holdUntil || !heldPackageId) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (now < holdUntil) return;
      const expiredId = heldPackageId;
      const expiredHoldId = holdId;
      setHoldUntil(null);
      setHeldPackageId(null);
      setHoldId(null);
      setExpiredNotice(true);
      setGuestStep("packages");
      if (expiredHoldId) fetch("/api/state", { method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"release",holdId:expiredHoldId}) }).then(r=>r.json()).then(p=>p.state&&setData(p.state)).catch(()=>undefined);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [holdUntil, heldPackageId, holdId]);

  const selectedPackage = data.packages.find((pkg) => pkg.id === selectedPackageId) ?? data.packages[0];
  const selectedOrder = data.orders.find((order) => order.id === selectedOrderId) ?? data.orders[0];
  const destination = data.paymentDestinations.find((item) => item.id === destinationId && item.enabled)
    ?? data.paymentDestinations.find((item) => item.enabled)
    ?? data.paymentDestinations[0];
  const reviewOrders = data.orders.filter((order) => order.status === "awaiting" || order.status === "resubmit");
  const confirmedRevenue = data.orders.filter((order) => order.status === "paid").reduce((sum, order) => sum + order.amount, 0);
  const pendingRevenue = reviewOrders.reduce((sum, order) => sum + order.amount, 0);
  const totalRemaining = data.packages.reduce((sum, pkg) => sum + remaining(pkg), 0);
  const progress = Math.max(0, guestSteps.indexOf(guestStep));
  const holdMs = holdUntil ? Math.max(0, holdUntil - clock) : 0;
  const holdTime = `${Math.floor(holdMs / 60000)}:${String(Math.floor((holdMs % 60000) / 1000)).padStart(2, "0")}`;

  const visibleOrders = useMemo(() => {
    const base = orderFilter === "review" ? reviewOrders : data.orders;
    const needle = query.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((order) =>
      [order.id, order.guestName, order.guestPhone, order.packageName, order.transactionId, order.network, statusLabel(order.status)]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data.orders, orderFilter, query]);

  async function persist(next: AppState) {
    setData(next);
    setSaveState("saving");
    try {
      await fetch("/api/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: next }) });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1600);
    } catch {
      setSaveState("idle");
    }
  }

  async function runAction(body: Record<string, unknown>) {
    const response = await fetch("/api/state", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) });
    const payload = await response.json() as { state?: AppState; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Action failed");
    if (payload.state) setData(payload.state);
    return payload.state;
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function beginGuest(event: FormEvent) {
    event.preventDefault();
    if (!guestName.trim() || guestPhone.replace(/\D/g, "").length < 9 || !phoneConfirmed) return;
    setPayerName(guestName.trim().toUpperCase());
    setSenderPhone(guestPhone.trim());
    setGuestStep("packages");
  }

  async function choosePackage(pkg: Package) {
    if (remaining(pkg) <= 0 || !pkg.active) return;
    if (holdId && heldPackageId !== pkg.id) await runAction({action:"release",holdId});
    const nextHoldId = heldPackageId === pkg.id && holdId ? holdId : crypto.randomUUID();
    const expiresAt = Date.now() + data.event.reservationMinutes * 60000;
    if (nextHoldId !== holdId) await runAction({action:"hold",holdId:nextHoldId,packageId:pkg.id,expiresAt});
    setSelectedPackageId(pkg.id);
    setHeldPackageId(pkg.id);
    setHoldId(nextHoldId);
    setHoldUntil(expiresAt);
    setClock(Date.now());
    setExpiredNotice(false);
    setGuestStep("pay");
  }

  async function copyNumber() {
    try { await navigator.clipboard.writeText(destination.number.replace(/\s/g, "")); } catch { /* clipboard may be unavailable in preview */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!selectedPackage || transactionId.trim().length < 6 || !payerName.trim() || senderPhone.replace(/\D/g, "").length < 9) return;
    let screenshotKey: string | null = null;
    if (screenshot) {
      const form = new FormData();
      form.set("file", screenshot);
      const upload = await fetch("/api/upload", { method: "POST", body: form });
      const uploaded = await upload.json() as { key?: string | null };
      screenshotKey = uploaded.key ?? null;
    }
    const order: Order = {
      id: makeOrderCode(), guestName: guestName.trim(), guestPhone: guestPhone.trim(),
      packageId: selectedPackage.id, packageName: selectedPackage.name, amount: selectedPackage.price,
      network: `${destination.label} · ${destination.number}`, transactionId: transactionId.trim(), payerName: payerName.trim(), senderPhone: senderPhone.trim(),
      status: "awaiting", submittedAt: "Just now",
    };
    try {
      if (!holdId) throw new Error("Reservation expired. Please select the package again.");
      await runAction({action:"submit",order,holdId,screenshotKey});
      setCurrentOrder({...order,screenshotKey}); setSelectedOrderId(order.id); setHeldPackageId(null); setHoldId(null); setHoldUntil(null); setGuestStep("status");
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not submit payment"); }
  }

  async function setOrderStatus(order: Order, status: "paid" | "unverified" | "resubmit") {
    try { await runAction({action:"order-status",orderId:order.id,status}); showToast(status === "paid" ? "Payment confirmed and inventory updated." : status === "resubmit" ? "Guest marked for resubmission." : "Payment could not be verified."); }
    catch(error){showToast(error instanceof Error?error.message:"Could not update order");}
  }

  async function cancelOrder(order: Order) {
    try { await runAction({action:"order-status",orderId:order.id,status:"cancelled"}); showToast("Order cancelled and inventory restored."); }
    catch(error){showToast(error instanceof Error?error.message:"Could not cancel order");}
  }

  async function updatePackage(id: string, changes: Partial<Package>) {
    await persist({ ...data, packages: data.packages.map((pkg) => pkg.id === id ? { ...pkg, ...changes } : pkg) });
  }

  function addPackage() {
    const pkg: Package = { id: `package-${Date.now()}`, name: "New package", description: "Add package contents.", price: 1000, capacity: 5, reserved: 0, paid: 0, active: false, initials: "NP" };
    persist({ ...data, packages: [...data.packages, pkg] });
  }

  function updateEvent(field: keyof AppState["event"], value: string | number) {
    setData({ ...data, event: { ...data.event, [field]: value } });
  }

  function updateDestination(index: number, field: "number" | "accountName" | "enabled", value: string | boolean) {
    setData({ ...data, paymentDestinations: data.paymentDestinations.map((item, i) => i === index ? { ...item, [field]: value } : item) });
  }

  if (surface === "guest") {
    return (
      <main className="vibe-app guest-mode">
        <section className={`vibe-phone guest-screen step-${guestStep}`}>
          {guestStep === "landing" && (
            <div className="vibe-landing">
              <div className="landing-top">
                <span className="eyebrow">Private invitation</span>
                <div className="diamond-mark" aria-hidden="true" />
                <h1>{data.event.name}</h1>
                <p className="script-line">Your night, reserved.</p>
                <span className="secret-pill">The city&apos;s best kept secret</span>
              </div>
              <div className="event-facts">
                <div><i /> <strong>{data.event.date}</strong></div>
                <div><i /> <strong>{data.event.location}</strong></div>
              </div>
              <div className="landing-actions">
                <button className="vibe-primary" onClick={() => setGuestStep("details")}>Reserve your package</button>
                <p>No account needed · Pay with Mobile Money · Held {data.event.reservationMinutes} min</p>
              </div>
            </div>
          )}

          {guestStep !== "landing" && (
            <>
              <div className="flow-progress" aria-label={`Step ${progress + 1} of ${guestSteps.length}`}>{guestSteps.map((step, i) => <span key={step} className={i <= progress ? "done" : ""} />)}</div>

              {guestStep === "details" && (
                <form className="flow-page" onSubmit={beginGuest}>
                  <button type="button" className="back-link" onClick={() => setGuestStep("landing")}>← Back</button>
                  <p className="script-kicker">First things first…</p>
                  <h2>Who&apos;s reserving?</h2>
                  <p className="supporting">We use these details to match your payment and keep you updated.</p>
                  <label>Full name<input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Ama Serwaa" required /></label>
                  <label>Phone number<input value={guestPhone} onChange={(e) => { setGuestPhone(e.target.value); setPhoneConfirmed(false); }} placeholder="e.g. 055 123 4567" inputMode="tel" required /></label>
                  <label className="confirm-check"><input type="checkbox" checked={phoneConfirmed} onChange={(e) => setPhoneConfirmed(e.target.checked)} /><span>I&apos;ve checked — this number is correct</span></label>
                  <button className="vibe-primary" disabled={!guestName || guestPhone.replace(/\D/g, "").length < 9 || !phoneConfirmed}>See drinks packages</button>
                </form>
              )}

              {guestStep === "packages" && (
                <div className="flow-page packages-page">
                  <button className="back-link" onClick={() => setGuestStep("details")}>← Back</button>
                  <p className="script-kicker">{data.event.name}</p>
                  <h2>Choose your package</h2>
                  <p className="supporting">Your pick is held for {data.event.reservationMinutes} minutes while you pay via MoMo.</p>
                  {expiredNotice && <div className="flow-alert warning">Your hold expired and the package went back on sale — pick again.</div>}
                  {heldPackageId && <div className="flow-alert holding"><span>Holding {selectedPackage?.name}</span><strong>{holdTime}</strong></div>}
                  <div className="prototype-package-list">
                    {data.packages.filter((pkg) => pkg.active).map((pkg) => {
                      const left = remaining(pkg);
                      return <button key={pkg.id} className="prototype-package" disabled={left === 0} onClick={() => choosePackage(pkg)}>
                        <span className={`prototype-art art-${pkg.id}`}><i className="mini-bottle" /><b>{pkg.initials}</b></span>
                        <span className="prototype-copy"><span><strong>{pkg.name}</strong><b>{money(pkg.price)}</b></span><small>{pkg.description}</small><span><em className={left <= 3 ? "low" : ""}>{left === 0 ? "Sold out" : left <= 3 ? `Only ${left} left` : `${left} left`}</em><u>{left === 0 ? "—" : "Select →"}</u></span></span>
                      </button>;
                    })}
                  </div>
                </div>
              )}

              {guestStep === "pay" && selectedPackage && (
                <div className="flow-page pay-page">
                  <button className="back-link" onClick={() => setGuestStep("packages")}>← Packages</button>
                  <div className="hold-chip">Hold · {holdTime}</div>
                  <p className="script-kicker">Almost yours…</p>
                  <h2>Pay with Mobile Money</h2>
                  <div className="selected-strip"><span>{selectedPackage.initials}</span><div><small>{selectedPackage.name}</small><strong>{money(selectedPackage.price)}</strong></div></div>
                  <p className="field-caption">Choose a Mobile Money account</p>
                  <div className="network-grid">{data.paymentDestinations.filter((item) => item.enabled).map((item) => <button key={item.id} className={destination.id === item.id ? "active" : ""} onClick={() => setDestinationId(item.id)}><i className={`network-dot net-${item.network.split(" ")[0].toLowerCase()}`} />{item.label}</button>)}</div>
                  <div className="pay-destination"><small>Send exactly</small><strong>{money(selectedPackage.price)}</strong><span>to</span><b>{destination.number}</b><p>{destination.accountName}</p><button onClick={copyNumber}>{copied ? "Copied ✓" : "Copy number"}</button></div>
                  <div className="flow-alert warning">Confirm the recipient name in your MoMo prompt before sending.</div>
                  <button className="vibe-primary" onClick={() => setGuestStep("proof")}>I&apos;ve paid — continue</button>
                </div>
              )}

              {guestStep === "proof" && selectedPackage && (
                <form className="flow-page proof-page" onSubmit={submitPayment}>
                  <button type="button" className="back-link" onClick={() => setGuestStep("pay")}>← Payment instructions</button>
                  <div className="hold-chip">Hold · {holdTime}</div>
                  <p className="script-kicker">One last thing…</p>
                  <h2>Submit payment</h2>
                  <p className="supporting">Enter the information from your Mobile Money confirmation message.</p>
                  <label>Transaction ID<input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 88432105779" required /></label>
                  <label>Name used for payment<input value={payerName} onChange={(e) => setPayerName(e.target.value)} required /></label>
                  <label>MoMo number used<input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} inputMode="tel" required /></label>
                  <label className="upload-field"><span>{screenshot ? `${screenshot.name} attached ✓` : "+ Attach payment screenshot · optional"}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} /></label>
                  <button className="vibe-primary">Submit for verification</button>
                </form>
              )}

              {guestStep === "status" && currentOrder && (
                <div className="flow-page status-page">
                  <div className="status-symbol">✓</div>
                  <p className="script-kicker">We&apos;ve got it.</p>
                  <h2>Awaiting verification</h2>
                  <p className="supporting">An organizer will check your payment details by the end of today.</p>
                  <div className="order-ticket"><span>Order reference<strong>{currentOrder.id}</strong></span><span>Package<b>{currentOrder.packageName}</b></span><span>Amount<b>{money(currentOrder.amount)}</b></span><span>Status<em>{statusLabel(currentOrder.status)}</em></span></div>
                  <button className="vibe-secondary" onClick={() => data.event.whatsapp ? window.open(`https://wa.me/${data.event.whatsapp.replace(/\D/g, "")}`, "_blank") : showToast("Add the organizer WhatsApp number in event settings.")}>WhatsApp organizer</button>
                </div>
              )}
            </>
          )}
        </section>
        {toast && <div className="toast" role="status">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="vibe-app organizer-mode">
      {!signedIn ? (
        <section className="vibe-phone organizer-login">
          <div className="organizer-login-mark">SHH</div>
          <p className="script-kicker">Organizer access</p>
          <h1>Manage the vibe.</h1>
          <p>Access will be restricted to the approved organizer account: freshfaya6@yahoo.com.</p>
          {initialUserEmail && !organizerAllowed ? <p className="flow-alert warning">This account is not approved for organizer access.</p> : null}
          <button className="vibe-primary" onClick={() => organizerAllowed ? setSignedIn(true) : window.location.assign("/signin-with-chatgpt?return_to=/organizer")}>Sign in with approved email</button>
          <small>Sign in using the approved organizer email.</small>
        </section>
      ) : (
        <section className="organizer-mobile">
          <header className="organizer-top"><div><small>Nana · organizer</small><strong>{data.event.name}</strong></div><button onClick={() => window.location.assign("/signout-with-chatgpt?return_to=/organizer")}>Sign out</button></header>
          <nav className="organizer-tabs"><button className={adminTab === "orders" ? "active" : ""} onClick={() => setAdminTab("orders")}><span>◎</span>Orders</button><button className={adminTab === "packages" ? "active" : ""} onClick={() => setAdminTab("packages")}><span>◇</span>Packages</button><button className={adminTab === "settings" ? "active" : ""} onClick={() => setAdminTab("settings")}><span>⚙</span>Settings</button></nav>

          {adminTab === "orders" && <div className="admin-mobile-page">
            <div className="admin-heading"><div><p className="script-kicker">Tonight at a glance</p><h1>Verification queue</h1></div><small>{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Live"}</small></div>
            <div className="mobile-stats"><div><small>Confirmed</small><strong>{money(confirmedRevenue)}</strong></div><div><small>Pending</small><strong>{money(pendingRevenue)}</strong></div><div><small>Pkgs left</small><strong>{totalRemaining}</strong></div></div>
            <div className="order-filter"><button className={orderFilter === "review" ? "active" : ""} onClick={() => setOrderFilter("review")}>Needs review · {reviewOrders.length}</button><button className={orderFilter === "all" ? "active" : ""} onClick={() => setOrderFilter("all")}>All orders · {data.orders.length}</button></div>
            <input className="admin-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, ref, package, transaction ID…" />
            <div className="mobile-order-list">{visibleOrders.length ? visibleOrders.map((order) => <button key={order.id} className={selectedOrder?.id === order.id ? "selected" : ""} onClick={() => setSelectedOrderId(order.id)}><span><small>{order.id}</small><strong>{order.guestName}</strong></span><em className={`order-status status-${order.status}`}>{statusLabel(order.status)}</em><p>{order.packageName} · <b>{money(order.amount)}</b> · {order.network}<time>{order.submittedAt}</time></p></button>) : <div className="mobile-empty">No matching orders.</div>}</div>
            {selectedOrder && <article className="mobile-order-detail">
              <div className="detail-title"><button onClick={() => setSelectedOrderId("")}>← Queue</button><em className={`order-status status-${selectedOrder.status}`}>{statusLabel(selectedOrder.status)}</em></div>
              <h2>{selectedOrder.id}</h2>
              <section><small>Guest</small><p><span>Name</span><b>{selectedOrder.guestName}</b></p><p><span>Phone</span><b>{selectedOrder.guestPhone}</b></p><p><span>Package</span><b>{selectedOrder.packageName} · {money(selectedOrder.amount)}</b></p></section>
              <section><small>Submitted payment</small><p><span>Network</span><b>{selectedOrder.network}</b></p><p><span>Transaction ID</span><b className="accent-text">{selectedOrder.transactionId}</b></p><p><span>Name on payment</span><b>{selectedOrder.payerName}</b></p><p><span>MoMo number</span><b>{selectedOrder.senderPhone}</b></p>{selectedOrder.screenshotKey ? <a className="proof-file" href={`/api/upload?key=${encodeURIComponent(selectedOrder.screenshotKey)}`} target="_blank" rel="noreferrer">Open payment screenshot ↗</a> : <div className="proof-file">No payment screenshot attached</div>}</section>
              <label>Verification note<textarea placeholder="e.g. Matches MTN statement 21:14" /></label>
              <div className="verification-actions"><button className="confirm" onClick={() => setOrderStatus(selectedOrder, "paid")}>Confirm payment</button><div><button onClick={() => setOrderStatus(selectedOrder, "unverified")}>Can&apos;t verify</button><button onClick={() => setOrderStatus(selectedOrder, "resubmit")}>Ask to resubmit</button></div><button className="cancel" onClick={() => cancelOrder(selectedOrder)}>Cancel order & restore inventory</button></div>
            </article>}
          </div>}

          {adminTab === "packages" && <div className="admin-mobile-page"><div className="admin-heading"><div><p className="script-kicker">Drinks packages</p><h1>Manage packages</h1></div><button className="small-add" onClick={addPackage}>+ New</button></div><p className="supporting">Hidden packages do not show to guests. Quantity zero means sold out.</p><div className="mobile-package-admin">{data.packages.map((pkg) => <PackageEditor key={pkg.id} pkg={pkg} onUpdate={(changes) => updatePackage(pkg.id, changes)} />)}</div></div>}

          {adminTab === "settings" && <div className="admin-mobile-page"><div className="admin-heading"><div><p className="script-kicker">Reusable event setup</p><h1>Event settings</h1></div></div><div className="mobile-settings-card"><h2>Event</h2><label>Party name<input value={data.event.name} onChange={(e) => updateEvent("name", e.target.value)} /></label><label>Date and time<input value={data.event.date} onChange={(e) => updateEvent("date", e.target.value)} /></label><label>Venue<input value={data.event.location} onChange={(e) => updateEvent("location", e.target.value)} /></label><label>Invitation message<textarea value={data.event.message} onChange={(e) => updateEvent("message", e.target.value)} /></label><div className="settings-pair"><label>Reservation hold<input type="number" min="5" max="120" value={data.event.reservationMinutes} onChange={(e) => updateEvent("reservationMinutes", Number(e.target.value))} /></label><label>WhatsApp contact<input value={data.event.whatsapp} onChange={(e) => updateEvent("whatsapp", e.target.value)} /></label></div></div><div className="mobile-settings-card"><h2>Payment destinations</h2>{data.paymentDestinations.map((item, index) => <div className="network-setting" key={item.id}><div><i className={`network-dot net-${item.network.split(" ")[0].toLowerCase()}`} /><strong>{item.label}</strong><label className="mini-toggle"><input type="checkbox" checked={item.enabled} onChange={(e) => updateDestination(index, "enabled", e.target.checked)} /><span /></label></div><input value={item.number} onChange={(e) => updateDestination(index, "number", e.target.value)} /><input value={item.accountName} onChange={(e) => updateDestination(index, "accountName", e.target.value)} /></div>)}<button className="vibe-primary" onClick={() => persist(data)}>Save event and payment settings</button></div></div>}
        </section>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function PackageEditor({ pkg, onUpdate }: { pkg: Package; onUpdate: (changes: Partial<Package>) => void }) {
  const [draft, setDraft] = useState(pkg);
  useEffect(() => setDraft(pkg), [pkg]);
  const left = remaining(draft);
  return <article className="mobile-package-editor"><div className={`editor-art art-${draft.id}`}><i className="mini-bottle" /><b>{draft.initials}</b></div><div className="editor-fields"><div><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><label>GHS<input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></label></div><input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div><div className="editor-actions"><div><button onClick={() => setDraft({ ...draft, capacity: Math.max(draft.paid + draft.reserved, draft.capacity - 1) })}>−</button><strong>{left} left</strong><button onClick={() => setDraft({ ...draft, capacity: draft.capacity + 1 })}>+</button></div><label><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />{draft.active ? "Visible" : "Hidden"}</label><button onClick={() => setDraft({ ...draft, capacity: draft.paid + draft.reserved })}>Sell out</button><button className="save-package" onClick={() => onUpdate(draft)}>Save</button></div></article>;
}
