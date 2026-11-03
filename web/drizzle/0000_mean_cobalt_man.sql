CREATE TABLE `camp_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `camp_members` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`session` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`avatar` text,
	`seen` integer NOT NULL,
	`joined` integer NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `camp_rooms`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session`) REFERENCES `camp_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `camp_members_room_idx` ON `camp_members` (`room`);--> statement-breakpoint
CREATE TABLE `camp_oauth_states` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `camp_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `camp_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`avatar` text,
	`discord_id` text,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `camp_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `camp_rooms`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender`) REFERENCES `camp_members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient`) REFERENCES `camp_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `camp_signals_recipient_idx` ON `camp_signals` (`recipient`,`id`);