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
  network: Network;
  transactionId: string;
  payerName: string;
  senderPhone: string;
  status: OrderStatus;
  submittedAt: string;
  note?: string;
};

export type PaymentDestination = {
  network: Network;
  number: string;
  accountName: string;
  enabled: boolean;
};

export type AppState = {
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

export const defaultState: AppState = {
  event: {
    name: "Midnight Reserve",
    date: "Saturday · 8:00 PM",
    location: "Accra",
    message: "Your night, reserved. Choose your drinks package and secure your place.",
    whatsapp: "",
    reservationMinutes: 30,
  },
  packages: [
    {
      id: "gold-table",
      name: "Gold Table",
      description: "Premium spirit, mixers and ice for two.",
      price: 450,
      capacity: 10,
      reserved: 4,
      paid: 3,
      active: true,
      initials: "GT",
    },
    {
      id: "midnight-duo",
      name: "Midnight Duo",
      description: "One spirit, mixers and two signature shots.",
      price: 280,
      capacity: 20,
      reserved: 3,
      paid: 5,
      active: true,
      initials: "MD",
    },
    {
      id: "solo-spark",
      name: "Solo Spark",
      description: "Personal bottle service with mixers.",
      price: 150,
      capacity: 15,
      reserved: 2,
      paid: 5,
      active: true,
      initials: "SS",
    },
  ],
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
    { network: "MTN MoMo", number: "Add before launch", accountName: "Add before launch", enabled: true },
    { network: "Telecel Cash", number: "Add before launch", accountName: "Add before launch", enabled: true },
    { network: "AT Money", number: "Add before launch", accountName: "Add before launch", enabled: true },
  ],
};
