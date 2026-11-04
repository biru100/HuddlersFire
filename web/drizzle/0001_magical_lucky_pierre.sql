ALTER TABLE `camp_members` ADD `ready` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_rooms` ADD `epoch` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_rooms` ADD `lease_until` integer DEFAULT 0 NOT NULL;