ALTER TABLE `camp_members` ADD `snapshot_epoch` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_members` ADD `snapshot_seq` integer DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_members` ADD `snapshot_time` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_members` ADD `signal_after` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_rooms` ADD `recovery_epoch` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_rooms` ADD `recovery_seq` integer DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_rooms` ADD `recovery_time` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_rooms` ADD `cleanup_after` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `camp_rooms` ADD `handoffs` integer DEFAULT 0 NOT NULL;