CREATE TABLE `activity_event` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activityEvent_organizationId_idx` ON `activity_event` (`organization_id`);--> statement-breakpoint
CREATE INDEX `activityEvent_userId_idx` ON `activity_event` (`user_id`);--> statement-breakpoint
CREATE INDEX `activityEvent_createdAt_idx` ON `activity_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `activityEvent_type_idx` ON `activity_event` (`type`);--> statement-breakpoint
CREATE TABLE `diet_chart` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`team_id` text,
	`title` text NOT NULL,
	`client_name` text,
	`notes` text,
	`days_json` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`updated_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dietChart_organizationId_idx` ON `diet_chart` (`organization_id`);--> statement-breakpoint
CREATE INDEX `dietChart_teamId_idx` ON `diet_chart` (`team_id`);--> statement-breakpoint
CREATE INDEX `dietChart_createdByUserId_idx` ON `diet_chart` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `dietChart_updatedAt_idx` ON `diet_chart` (`updated_at`);--> statement-breakpoint
CREATE TABLE `work_session` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workSession_organizationId_idx` ON `work_session` (`organization_id`);--> statement-breakpoint
CREATE INDEX `workSession_userId_idx` ON `work_session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workSession_open_unique` ON `work_session` (`organization_id`,`user_id`) WHERE "work_session"."ended_at" is null;