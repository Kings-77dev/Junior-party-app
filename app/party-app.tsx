"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  defaultState,
  type AppState,
  type Network,
  type Order,
  type OrderStatus,
  type Package,
} from "./data";

type GuestStep = "details" | "packages" | "payment" | "status";
type AdminTab = "orders" | "packages" | "settings";

const stepOrder: GuestStep[] = ["details", "packages", "payment", "status"];

function money(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

function remaining(pkg: Package) {
  return Math.max(0, pkg.capacity - pkg.reserved - pkg.paid);
}

function makeOrderCode() {
  return `MR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function PartyApp() {
  const [data, setData] = useState<AppState>(defaultState);
  const [mode, setMode] = useState<"guest" | "organizer">("guest");
  const [guestStep, setGuestStep] = useState<GuestStep>("details");
  const [adminTab, setAdminTab] = useState<AdminTab>("orders");
  const [signedIn, setSignedIn] = useState(false);
  const [guestName, setGuestName] = useState("Ama Mensah");
  const [guestPhone, setGuestPhone] = useState("024 123 4567");
  const [phoneConfirmed, setPhoneConfirmed] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState("gold-table");
  const [network, setNetwork] = useState<Network>("MTN MoMo");
  const [transactionId, setTransactionId] = useState("");
  const [payerName, setPayerName] = useState("Ama Mensah");
  const [senderPhone, setSenderPhone] = useState("024 123 4567");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState("MR-A7K9");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/state")
      .then((response) => response.json())
      .then((payload: { state?: AppState }) => payload.state && setData(payload.state))
      .catch(() => undefined);
  }, []);

  const selectedPackage =
    data.packages.find((pkg) => pkg.id === selectedPackageId) ?? data.packages[0];
  const selectedOrder =
    data.orders.find((order) => order.id === selectedOrderId) ?? data.orders[0];
  const destination =
    data.paymentDestinations.find((item) => item.network === network) ??
    data.paymentDestinations[0];
  const awaitingOrders = data.orders.filter((order) => order.status === "awaiting");
  const confirmedRevenue = data.orders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + order.amount, 0);
  const totalRemaining = data.packages.reduce((sum, pkg) => sum + remaining(pkg), 0);

  const progress = useMemo(() => stepOrder.indexOf(guestStep), [guestStep]);

  async function persist(next: AppState) {
    setData(next);
    setSaveState("saving");
    try {
      await fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: next }),
      });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
    } catch {
      setSaveState("idle");
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function beginGuest(event: FormEvent) {
    event.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !phoneConfirmed) return;
    setPayerName(guestName);
    setSenderPhone(guestPhone);
    setGuestStep("packages");
  }

  function choosePackage(pkg: Package) {
    if (remaining(pkg) <= 0 || !pkg.active) return;
    setSelectedPackageId(pkg.id);
    setGuestStep("payment");
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!selectedPackage || !transactionId.trim()) return;
    if (screenshot) {
      const form = new FormData();
      form.set("file", screenshot);
      await fetch("/api/upload", { method: "POST", body: form }).catch(() => undefined);
    }
    const order: Order = {
      id: makeOrderCode(),
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      amount: selectedPackage.price,
      network,
      transactionId: transactionId.trim(),
      payerName: payerName.trim(),
      senderPhone: senderPhone.trim(),
      status: "awaiting",
      submittedAt: "Just now",
    };
    const next: AppState = {
      ...data,
      packages: data.packages.map((pkg) =>
        pkg.id === selectedPackage.id ? { ...pkg, reserved: pkg.reserved + 1 } : pkg,
      ),
      orders: [order, ...data.orders],
    };
    setCurrentOrder(order);
    setSelectedOrderId(order.id);
    await persist(next);
    setGuestStep("status");
  }

  async function decideOrder(order: Order, status: "paid" | "unverified") {
    const next: AppState = {
      ...data,
      orders: data.orders.map((item) => (item.id === order.id ? { ...item, status } : item)),
      packages: data.packages.map((pkg) => {
        if (pkg.id !== order.packageId) return pkg;
        return {
          ...pkg,
          reserved: Math.max(0, pkg.reserved - 1),
          paid: status === "paid" ? pkg.paid + 1 : pkg.paid,
        };
      }),
    };
    await persist(next);
    showToast(status === "paid" ? "Payment confirmed and inventory updated." : "Guest can now resubmit payment details.");
  }

  async function updatePackage(id: string, changes: Partial<Package>) {
    const next = {
      ...data,
      packages: data.packages.map((pkg) => (pkg.id === id ? { ...pkg, ...changes } : pkg)),
    };
    await persist(next);
  }

  function addPackage() {
    const newPackage: Package = {
      id: `package-${Date.now()}`,
      name: "New package",
      description: "Add a short package description.",
      price: 100,
      capacity: 10,
      reserved: 0,
      paid: 0,
      active: false,
      initials: "NP",
    };
    persist({ ...data, packages: [...data.packages, newPackage] });
  }

  function updateEvent(field: keyof AppState["event"], value: string | number) {
    setData({ ...data, event: { ...data.event, [field]: value } });
  }

  function updateDestination(index: number, field: "number" | "accountName" | "enabled", value: string | boolean) {
    setData({
      ...data,
      paymentDestinations: data.paymentDestinations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    });
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <button className="brand-button" onClick={() => { setMode("guest"); setGuestStep("details"); }}>
          <span className="brand-mark">MR</span>
          <span><small>Private experience</small>{data.event.name}</span>
        </button>
        <nav className="mode-nav" aria-label="Preview area">
          <button className={mode === "guest" ? "nav-pill active" : "nav-pill"} onClick={() => setMode("guest")}>Guest</button>
          <button className={mode === "organizer" ? "nav-pill active" : "nav-pill"} onClick={() => setMode("organizer")}>Organizer</button>
        </nav>
      </header>

      {mode === "guest" ? (
        <section className="guest-page">
          <div className="guest-hero">
            <div className="hero-orbit" aria-hidden="true"><span>MR</span></div>
            <p className="kicker">Invitation access · {data.event.location}</p>
            <h1>Midnight<br /><em>Reserve</em></h1>
            <span className="hero-signature">Your night, reserved.</span>
            <p>{data.event.message}</p>
            <div className="event-meta"><span>{data.event.date}</span><i /> <span>{data.event.location}</span></div>
          </div>
          <div className="progress-track" aria-label={`Step ${progress + 1} of 4`}>
            {stepOrder.map((step, index) => <span key={step} className={index <= progress ? "complete" : ""} />)}
          </div>

          {guestStep === "details" && (
            <form className="surface guest-card entry-card" onSubmit={beginGuest}>
              <div className="section-title"><div><span className="step-label">Welcome, VIP guest</span><h2>Your reservation starts here</h2><p>Enter the name and number we should use to match your Mobile Money payment.</p></div></div>
              <label>Full name<input value={guestName} onChange={(event) => setGuestName(event.target.value)} required /></label>
              <label>Phone number<input value={guestPhone} onChange={(event) => { setGuestPhone(event.target.value); setPhoneConfirmed(false); }} inputMode="tel" required /></label>
              <label className="check-row"><input type="checkbox" checked={phoneConfirmed} onChange={(event) => setPhoneConfirmed(event.target.checked)} /><span>Yes, this number is correct</span></label>
              <button className="primary-button full" disabled={!guestName || !guestPhone || !phoneConfirmed}>View drinks packages <span>→</span></button>
            </form>
          )}

          {guestStep === "packages" && (
            <div className="guest-card menu-view">
              <div className="section-title split"><div><span className="step-label">Step 2 of 4</span><h2>Choose your package</h2><p>Your selection will be held for 30 minutes.</p></div><span className="timer">30:00</span></div>
              <div className="filter-pills" aria-label="Package filters"><span className="active">All packages</span><span>Best sellers</span><span>Limited</span></div>
              <div className="package-list">
                {data.packages.filter((pkg) => pkg.active).map((pkg) => (
                  <button className={`surface package-row package-${pkg.id}`} key={pkg.id} onClick={() => choosePackage(pkg)} disabled={remaining(pkg) === 0}>
                    <span className="package-visual" aria-hidden="true"><span className="bottle bottle-one" /><span className="bottle bottle-two" /><span className="package-monogram">{pkg.initials}</span></span>
                    <span className="package-overlay">
                      <span className="package-copy"><small>Drinks experience</small><strong>{pkg.name}</strong><span>{pkg.description}</span></span>
                      <span className="package-price"><strong>{money(pkg.price)}</strong><span className={remaining(pkg) <= 3 ? "stock low" : "stock"}>{remaining(pkg) ? `${remaining(pkg)} left` : "Sold out"}</span></span>
                    </span>
                  </button>
                ))}
              </div>
              <button className="text-button" onClick={() => setGuestStep("details")}>← Back</button>
            </div>
          )}

          {guestStep === "payment" && selectedPackage && (
            <form className="surface guest-card payment-card" onSubmit={submitPayment}>
              <div className={`selected-package-banner package-${selectedPackage.id}`}><span className="package-monogram">{selectedPackage.initials}</span><div><small>Your selection</small><strong>{selectedPackage.name}</strong></div><b>{money(selectedPackage.price)}</b></div>
              <div className="section-title split"><div><span className="step-label">Step 3 of 4</span><h2>Pay with Mobile Money</h2><p>Send the exact amount, then submit your transaction.</p></div><span className="timer">29:42</span></div>
              <div className="network-tabs">
                {data.paymentDestinations.filter((item) => item.enabled).map((item) => <button type="button" key={item.network} className={network === item.network ? "network active" : "network"} onClick={() => setNetwork(item.network)}>{item.network}</button>)}
              </div>
              <div className="payment-summary">
                <div><span>Package</span><strong>{selectedPackage.name}</strong></div><div><span>Amount</span><strong>{money(selectedPackage.price)}</strong></div>
                <div><span>Pay to</span><strong>{destination.number}</strong></div><div><span>Account name</span><strong>{destination.accountName}</strong></div>
              </div>
              <div className="notice"><span>!</span><p>These are placeholder payment details. Add real MoMo numbers before launch.</p></div>
              <label>Transaction ID<input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Enter transaction ID" required /></label>
              <div className="two-fields"><label>Payer name<input value={payerName} onChange={(event) => setPayerName(event.target.value)} required /></label><label>Sender’s MoMo number<input value={senderPhone} onChange={(event) => setSenderPhone(event.target.value)} required /></label></div>
              <label>Payment screenshot <span className="optional">Optional · max 5 MB</span><input className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} /></label>
              <button className="primary-button full">I’ve paid — submit details <span>→</span></button>
              <button type="button" className="text-button center" onClick={() => setGuestStep("packages")}>Back to packages</button>
            </form>
          )}

          {guestStep === "status" && currentOrder && (
            <div className="surface guest-card status-card">
              <span className="status-icon">⌛</span><span className="step-label">Awaiting verification</span><h2>We have your payment details</h2><p>An organizer will check the transaction by the end of today.</p>
              <div className="status-grid"><div><span>Order</span><strong>{currentOrder.id}</strong></div><div><span>Package</span><strong>{currentOrder.packageName}</strong></div><div><span>Amount</span><strong>{money(currentOrder.amount)}</strong></div><div><span>Status</span><strong>Pending</strong></div></div>
              <div className="status-actions"><button className="primary-button" onClick={() => { setMode("organizer"); setSignedIn(true); setAdminTab("orders"); setSelectedOrderId(currentOrder.id); }}>Preview organizer check</button><button className="secondary-button">WhatsApp organizer</button></div>
            </div>
          )}
          <nav className="mobile-dock" aria-label="Guest navigation">
            <button className={guestStep === "details" ? "active" : ""} onClick={() => setGuestStep("details")}><span>⌂</span>Home</button>
            <button className={guestStep === "packages" ? "active" : ""} onClick={() => setGuestStep("packages")}><span>◇</span>Packages</button>
            <button className={guestStep === "payment" ? "active" : ""} onClick={() => selectedPackage && setGuestStep("payment")}><span>✦</span>Reserve</button>
            <button className={guestStep === "status" ? "active" : ""} onClick={() => currentOrder && setGuestStep("status")}><span>○</span>Status</button>
          </nav>
        </section>
      ) : (
        <section className="organizer-page">
          {!signedIn ? (
            <div className="surface login-card"><span className="login-mark">M</span><span className="step-label">Organizer access</span><h1>Manage the night.</h1><p>Google access will be restricted to three approved Gmail accounts before launch.</p><button className="primary-button full" onClick={() => setSignedIn(true)}>Continue with Google <span>→</span></button><small>Preview mode lets you continue without a real account.</small></div>
          ) : (
            <>
              <div className="admin-header"><div><span className="step-label">Organizer dashboard</span><h1>Good evening, Nana.</h1><p>{awaitingOrders.length} payments need verification before the end of today.</p></div><div className="save-indicator">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Preview data"}</div></div>
              <nav className="admin-tabs"><button className={adminTab === "orders" ? "active" : ""} onClick={() => setAdminTab("orders")}>Orders</button><button className={adminTab === "packages" ? "active" : ""} onClick={() => setAdminTab("packages")}>Packages</button><button className={adminTab === "settings" ? "active" : ""} onClick={() => setAdminTab("settings")}>Event settings</button></nav>

              {adminTab === "orders" && (
                <div>
                  <div className="stat-grid"><div className="surface stat"><span>Awaiting verification</span><strong>{awaitingOrders.length}</strong><small>{money(awaitingOrders.reduce((sum, order) => sum + order.amount, 0))} pending</small></div><div className="surface stat"><span>Confirmed sales</span><strong>{money(confirmedRevenue)}</strong><small>{data.orders.filter((order) => order.status === "paid").length} paid orders</small></div><div className="surface stat"><span>Packages remaining</span><strong>{totalRemaining}</strong><small>Across {data.packages.filter((pkg) => pkg.active).length} active packages</small></div></div>
                  {selectedOrder && selectedOrder.status === "awaiting" ? (
                    <div className="verification-layout">
                      <div className="surface order-queue"><div className="section-title split"><div><h2>Payments to verify</h2><p>Choose an order to inspect.</p></div><span className="stock low">{awaitingOrders.length} waiting</span></div>{awaitingOrders.map((order) => <button key={order.id} className={order.id === selectedOrder.id ? "queue-row active" : "queue-row"} onClick={() => setSelectedOrderId(order.id)}><span><strong>{order.guestName}</strong><small>{order.id} · {order.packageName}</small></span><strong>{money(order.amount)}</strong></button>)}</div>
                      <div className="surface verification-card"><div className="section-title split"><div><span className="step-label">Payment verification</span><h2>{selectedOrder.id}</h2><p>{selectedOrder.submittedAt}</p></div><span className="stock">Awaiting</span></div><div className="detail-list"><div><span>Guest</span><strong>{selectedOrder.guestName}</strong></div><div><span>Guest phone</span><strong>{selectedOrder.guestPhone}</strong></div><div><span>Package</span><strong>{selectedOrder.packageName}</strong></div><div><span>Expected amount</span><strong>{money(selectedOrder.amount)}</strong></div><div><span>Network</span><strong>{selectedOrder.network}</strong></div><div><span>Transaction ID</span><strong>{selectedOrder.transactionId}</strong></div></div><div className="proof-placeholder"><span>Payment screenshot</span><small>Optional supporting evidence</small></div><label>Organizer note<textarea placeholder="Optional verification note" /></label><div className="decision-actions"><button className="primary-button" onClick={() => decideOrder(selectedOrder, "paid")}>Confirm payment</button><button className="secondary-button" onClick={() => decideOrder(selectedOrder, "unverified")}>Could not verify</button></div></div>
                    </div>
                  ) : <div className="surface empty-state"><span>✓</span><h2>Verification queue is clear</h2><p>New payment submissions will appear here.</p></div>}
                </div>
              )}

              {adminTab === "packages" && (
                <div><div className="section-title split"><div><h2>Drinks packages</h2><p>Manage price, capacity and guest visibility.</p></div><button className="primary-button" onClick={addPackage}>+ Add package</button></div><div className="package-admin-grid">{data.packages.map((pkg) => <PackageEditor key={pkg.id} pkg={pkg} onUpdate={(changes) => updatePackage(pkg.id, changes)} />)}</div></div>
              )}

              {adminTab === "settings" && (
                <div className="settings-grid"><div className="surface settings-card"><div className="section-title"><h2>Event details</h2><p>Replace placeholders any time without rebuilding.</p></div><label>Party name<input value={data.event.name} onChange={(event) => updateEvent("name", event.target.value)} /></label><div className="two-fields"><label>Date and time<input value={data.event.date} onChange={(event) => updateEvent("date", event.target.value)} /></label><label>Location<input value={data.event.location} onChange={(event) => updateEvent("location", event.target.value)} /></label></div><label>Invitation message<textarea value={data.event.message} onChange={(event) => updateEvent("message", event.target.value)} /></label><label>Designated WhatsApp number<input value={data.event.whatsapp} onChange={(event) => updateEvent("whatsapp", event.target.value)} placeholder="Add before launch" /></label><button className="primary-button" onClick={() => persist(data)}>Save event details</button></div><div className="surface settings-card"><div className="section-title"><h2>Payment destinations</h2><p>Real numbers are only required before launch.</p></div>{data.paymentDestinations.map((item, index) => <div className="destination-editor" key={item.network}><div className="split"><strong>{item.network}</strong><label className="toggle"><input type="checkbox" checked={item.enabled} onChange={(event) => updateDestination(index, "enabled", event.target.checked)} /><span>Enabled</span></label></div><label>Destination number<input value={item.number} onChange={(event) => updateDestination(index, "number", event.target.value)} /></label><label>Account name<input value={item.accountName} onChange={(event) => updateDestination(index, "accountName", event.target.value)} /></label></div>)}<button className="primary-button" onClick={() => persist(data)}>Save payment settings</button></div></div>
              )}
            </>
          )}
        </section>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function PackageEditor({ pkg, onUpdate }: { pkg: Package; onUpdate: (changes: Partial<Package>) => void }) {
  const [draft, setDraft] = useState(pkg);
  useEffect(() => setDraft(pkg), [pkg]);
  return <article className="surface package-editor"><div className="package-art large">{draft.initials}</div><div className="split"><span className="step-label">{draft.active ? "Active" : "Hidden"}</span><span className={remaining(draft) <= 3 ? "stock low" : "stock"}>{remaining(draft)} left</span></div><label>Package name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><div className="two-fields"><label>Price (GHS)<input type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} /></label><label>Capacity<input type="number" min={draft.reserved + draft.paid} value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) })} /></label></div><label className="toggle"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /><span>Visible to guests</span></label><button className="secondary-button full" onClick={() => onUpdate(draft)}>Save package</button></article>;
}
