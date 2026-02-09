ALTER TABLE `search` ADD `avoid_takeaway` integer DEFAULT true NOT NULL;
UPDATE `search` SET `avoid_fast_food` = false;
