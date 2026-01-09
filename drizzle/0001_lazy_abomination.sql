PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_search_candidate` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`search_id` text(36) NOT NULL,
	`restaurant_id` text(36),
	`recovered_from_candidate_id` text(36),
	`order` integer NOT NULL,
	`status` text(8) NOT NULL,
	`rejection_reason` text(40),
	FOREIGN KEY (`search_id`) REFERENCES `search`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recovered_from_candidate_id`) REFERENCES `search_candidate`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_search_candidate`("id", "created_at", "search_id", "restaurant_id", "recovered_from_candidate_id", "order", "status", "rejection_reason") SELECT "id", "created_at", "search_id", "restaurant_id", null as "recovered_from_candidate_id", "order", "status", "rejection_reason" FROM `search_candidate`;--> statement-breakpoint
DROP TABLE `search_candidate`;--> statement-breakpoint
ALTER TABLE `__new_search_candidate` RENAME TO `search_candidate`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_search_candidate_to_search` ON `search_candidate` (`search_id`);--> statement-breakpoint
CREATE INDEX `idx_search_candidate_to_restaurant` ON `search_candidate` (`restaurant_id`);--> statement-breakpoint
CREATE INDEX `idx_search_candidate_to_candidate_recovered` ON `search_candidate` (`recovered_from_candidate_id`);
