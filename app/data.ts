export type Network = "MTN MoMo" | "Telecel Cash" | "AT Money";
export type OrderStatus =
  | "reserved"
  | "awaiting"
  | "paid"
  | "unverified"
  | "resubmit"
  | "cancelled"
  | "expired";

export type Package = {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  reserved: number;
  paid: number;
  active: boolean;
  initials: string;
};

export type Order = {
  id: string;
  guestName: string;
  guestPhone: string;
  packageId: string;
  packageName: string;
  amount: number;
  network: string;
  transactionId: string;
  payerName: string;
  senderPhone: string;
  status: OrderStatus;
  submittedAt: string;
  note?: string;
  screenshotKey?: string | null;
};

export type InventoryHold = {
  id: string;
  packageId: string;
  expiresAt: number;
};

export type PaymentDestination = {
  id: string;
  label: string;
  network: Network;
  number: string;
  accountName: string;
  enabled: boolean;
};

export type AppState = {
  catalogVersion?: number;
  configVersion?: number;
  organizerEmails?: string[];
  holds?: InventoryHold[];
  event: {
    name: string;
    date: string;
    location: string;
    message: string;
    whatsapp: string;
    reservationMinutes: number;
  };
  packages: Package[];
  orders: Order[];
  paymentDestinations: PaymentDestination[];
};

export const packageCatalog: Package[] = [
  {
    id: "bronze",
    name: "Bronze",
    description: "1× Mosketo · 1× La Roche · 3× JP Chenet · 2× Water",
    price: 2000,
    capacity: 10,
    reserved: 0,
    paid: 0,
    active: true,
    initials: "BR",
  },
  {
    id: "silver",
    name: "Silver",
    description: "1× Agor · 2× JP Chenet · 1× Black Label · 1× La Roche · 1× Shisha · 3× Mixers",
    price: 3000,
    capacity: 10,
    reserved: 0,
    paid: 0,
    active: true,
    initials: "SI",
  },
  {
    id: "gold",
    name: "Gold",
    description: "1× Mosketo · 1× Hennessy VS · 1× Belaire Phantom · 2× JP Chenet Gold · 1× Shisha · 4× Mixers",
    price: 5000,
    capacity: 10,
    reserved: 0,
    paid: 0,
    active: true,
    initials: "GO",
  },
  {
    id: "diamond",
    name: "Diamond",
    description: "1× Omelca · 1× Black Label · 1× Hennessy VS · 2× Belaire · 1× JP Chenet Gold · 8× Mixers · 10× Water · 2× Shisha",
    price: 7000,
    capacity: 10,
    reserved: 0,
    paid: 0,
    active: true,
    initials: "DI",
  },
  {
    id: "platinum",
    name: "Platinum",
    description: "1× Veuve Rich · 1× Hennessy · 1× Moët · 2× Belaire · 1× Jägermeister · 10× Water · 2× Shisha",
    price: 10000,
    capacity: 10,
    reserved: 0,
    paid: 0,
    active: true,
    initials: "PL",
  },
];

export const defaultState: AppState = {
  catalogVersion: 2,
  configVersion: 3,
  organizerEmails: ["freshfaya6@yahoo.com"],
  holds: [],
  event: {
    name: "Midnight Reserve",
    date: "Saturday · 8:00 PM",
    location: "Accra",
    message: "Your night, reserved. Choose your drinks package and secure your place.",
    whatsapp: "0557788343",
    reservationMinutes: 30,
  },
  packages: packageCatalog,
  orders: [
    {
      id: "MR-A7K9",
      guestName: "Ama Mensah",
      guestPhone: "024 123 4567",
      packageId: "gold-table",
      packageName: "Gold Table",
      amount: 450,
      network: "MTN MoMo",
      transactionId: "18492033172",
      payerName: "Ama Mensah",
      senderPhone: "024 123 4567",
      status: "awaiting",
      submittedAt: "Today · 8:42 PM",
    },
    {
      id: "MR-K2P4",
      guestName: "Kojo Asare",
      guestPhone: "020 778 1142",
      packageId: "midnight-duo",
      packageName: "Midnight Duo",
      amount: 280,
      network: "Telecel Cash",
      transactionId: "VC-7729401",
      payerName: "Kojo Asare",
      senderPhone: "020 778 1142",
      status: "awaiting",
      submittedAt: "Today · 8:31 PM",
    },
    {
      id: "MR-E8S1",
      guestName: "Esi Owusu",
      guestPhone: "027 901 0034",
      packageId: "solo-spark",
      packageName: "Solo Spark",
      amount: 150,
      network: "AT Money",
      transactionId: "AT-1900338",
      payerName: "Esi Owusu",
      senderPhone: "027 901 0034",
      status: "awaiting",
      submittedAt: "Today · 8:16 PM",
    },
  ],
  paymentDestinations: [
    { id: "mtn-primary", label: "MTN MoMo · Main line", network: "MTN MoMo", number: "0538044116", accountName: "Samuel Adjei", enabled: true },
    { id: "mtn-whatsapp", label: "MTN MoMo · WhatsApp line", network: "MTN MoMo", number: "0557788343", accountName: "Samuel Adjei", enabled: true },
    { id: "telecel", label: "Telecel Cash", network: "Telecel Cash", number: "Add before launch", accountName: "Add before launch", enabled: false },
    { id: "at-money", label: "AT Money", network: "AT Money", number: "Add before launch", accountName: "Add before launch", enabled: false },
  ],
};
