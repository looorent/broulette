PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_restaurant_profile` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`restaurant_id` text(36) NOT NULL,
	`source` text(50) NOT NULL,
	`external_id` text(255) NOT NULL,
	`external_type` text(50) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`name` text,
	`address` text,
	`country_code` text(20),
	`state` text(50),
	`description` text,
	`photo_id` text(36),
	`map_url` text,
	`rating` real,
	`rating_count` integer,
	`phone_number` text(20),
	`international_phone_number` text(25),
	`price_range` integer,
	`price_label` text,
	`opening_hours` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`operational` integer,
	`website` text,
	`source_url` text,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_restaurant_profile`("id", "created_at", "updated_at", "restaurant_id", "source", "external_id", "external_type", "version", "latitude", "longitude", "name", "address", "country_code", "state", "description", "photo_id", "map_url", "rating", "rating_count", "phone_number", "international_phone_number", "price_range", "price_label", "opening_hours", "tags", "operational", "website", "source_url") SELECT "id", "created_at", "updated_at", "restaurant_id", "source", "external_id", "external_type", "version", "latitude", "longitude", "name", "address", "country_code", "state", "description", "photo_id", "map_url", "rating", "rating_count", "phone_number", "international_phone_number", "price_range", "price_label", "opening_hours", "tags", "operational", "website", "source_url" FROM `restaurant_profile`;--> statement-breakpoint
DROP TABLE `restaurant_profile`;--> statement-breakpoint
ALTER TABLE `__new_restaurant_profile` RENAME TO `restaurant_profile`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_restaurant_profile_to_restaurant` ON `restaurant_profile` (`restaurant_id`);