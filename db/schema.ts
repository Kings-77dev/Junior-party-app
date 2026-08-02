import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const appState = sqliteTable("app_state", {
  id: text("id").primaryKey(), data: text("data").notNull(), updatedAt: text("updated_at").notNull(),
});

export const appConfig = sqliteTable("app_config", {
  id: text("id").primaryKey(), data: text("data").notNull(), updatedAt: text("updated_at").notNull(),
});

export const packages = sqliteTable("packages", {
  id: text("id").primaryKey(), name: text("name").notNull(), description: text("description").notNull(),
  price: integer("price").notNull(), capacity: integer("capacity").notNull(), reserved: integer("reserved").notNull(),
  paid: integer("paid").notNull(), active: integer("active", { mode: "boolean" }).notNull(), initials: text("initials").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), guestName: text("guest_name").notNull(), guestPhone: text("guest_phone").notNull(),
  packageId: text("package_id").notNull(), packageName: text("package_name").notNull(), amount: integer("amount").notNull(),
  network: text("network").notNull(), transactionId: text("transaction_id").notNull(), payerName: text("payer_name").notNull(),
  senderPhone: text("sender_phone").notNull(), status: text("status").notNull(), submittedAt: text("submitted_at").notNull(),
  note: text("note"), screenshotKey: text("screenshot_key"), updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("orders_transaction_id_unique").on(table.transactionId)]);

export const inventoryHolds = sqliteTable("inventory_holds", {
  id: text("id").primaryKey(), packageId: text("package_id").notNull(), expiresAt: integer("expires_at").notNull(), createdAt: text("created_at").notNull(),
});

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey(), actorEmail: text("actor_email").notNull(), action: text("action").notNull(),
  orderId: text("order_id"), details: text("details"), createdAt: text("created_at").notNull(),
});
