CREATE TABLE `restaurant_matching_attempt` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`restaurant_id` text(36) NOT NULL,
	`attempted_at` integer NOT NULL,
	`query_type` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`radius` integer,
	`query` text,
	`source` text NOT NULL,
	`found` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_matching_attempt_to_restaurant` ON `restaurant_matching_attempt` (`restaurant_id`);--> statement-breakpoint
CREATE INDEX `idx_matching_attempt_source_and_restaurant` ON `restaurant_matching_attempt` (`source`,`restaurant_id`);--> statement-breakpoint
CREATE INDEX `idx_matching_attempt_source_and_attempted_at` ON `restaurant_matching_attempt` (`source`,`attempted_at`);--> statement-breakpoint
CREATE TABLE `restaurant_profile` (
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
	`image_url` text,
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
CREATE INDEX `idx_restaurant_profile_to_restaurant` ON `restaurant_profile` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `restaurant` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text(100),
	`latitude` real NOT NULL,
	`longitude` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_restaurant_coordinates` ON `restaurant` (`latitude`,`longitude`);--> statement-breakpoint
CREATE TABLE `search_candidate` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`search_id` text(36) NOT NULL,
	`restaurant_id` text(36),
	`order` integer NOT NULL,
	`status` text(8) NOT NULL,
	`rejection_reason` text(50),
	FOREIGN KEY (`search_id`) REFERENCES `search`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_search_candidate_to_search` ON `search_candidate` (`search_id`);--> statement-breakpoint
CREATE INDEX `idx_search_candidate_to_restaurant` ON `search_candidate` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `search` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`service_date` integer NOT NULL,
	`service_instant` integer NOT NULL,
	`service_end` integer NOT NULL,
	`service_timeslot` text(8) NOT NULL,
	`distance_range` text(8) NOT NULL,
	`exhausted` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_search_coordinates` ON `search` (`latitude`,`longitude`);