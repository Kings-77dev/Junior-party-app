CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`order_id` text,
	`details` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_config` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_holds` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_name` text NOT NULL,
	`guest_phone` text NOT NULL,
	`package_id` text NOT NULL,
	`package_name` text NOT NULL,
	`amount` integer NOT NULL,
	`network` text NOT NULL,
	`transaction_id` text NOT NULL,
	`payer_name` text NOT NULL,
	`sender_phone` text NOT NULL,
	`status` text NOT NULL,
	`submitted_at` text NOT NULL,
	`note` text,
	`screenshot_key` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_transaction_id_unique` ON `orders` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `packages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`capacity` integer NOT NULL,
	`reserved` integer NOT NULL,
	`paid` integer NOT NULL,
	`active` integer NOT NULL,
	`initials` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_app_state` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_app_state`("id", "data", "updated_at") SELECT "id", "data", "updated_at" FROM `app_state`;--> statement-breakpoint
DROP TABLE `app_state`;--> statement-breakpoint
ALTER TABLE `__new_app_state` RENAME TO `app_state`;--> statement-breakpoint
PRAGMA foreign_keys=ON;