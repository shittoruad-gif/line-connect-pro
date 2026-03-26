CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultDuration` int NOT NULL DEFAULT 60,
	`autoPassword` boolean NOT NULL DEFAULT true,
	`defaultPassword` varchar(128) DEFAULT '',
	`titleSuffix` varchar(64) NOT NULL DEFAULT '様広告MTG',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL DEFAULT 'デフォルト',
	`template` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitation_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`clientName` varchar(256) NOT NULL,
	`scheduledAt` bigint NOT NULL,
	`duration` int NOT NULL DEFAULT 60,
	`zoomMeetingId` varchar(64),
	`joinUrl` text,
	`startUrl` text,
	`password` varchar(128),
	`screenshotUrl` text,
	`status` enum('created','mock','failed') NOT NULL DEFAULT 'created',
	`rawExtracted` text,
	`recurringId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passcodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(128) NOT NULL,
	`plan` enum('lifetime','paid') NOT NULL DEFAULT 'lifetime',
	`maxUses` int NOT NULL DEFAULT 1,
	`currentUses` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passcodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `passcodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `recurring_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`clientName` varchar(256) NOT NULL,
	`recurrenceType` enum('weekly','biweekly','monthly') NOT NULL DEFAULT 'weekly',
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`duration` int NOT NULL DEFAULT 60,
	`occurrences` int NOT NULL DEFAULT 4,
	`firstDate` bigint NOT NULL,
	`totalCreated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recurring_meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('free','paid','lifetime') NOT NULL DEFAULT 'free',
	`activatedAt` timestamp,
	`expiresAt` timestamp,
	`passcodeUsed` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zoom_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` varchar(256) NOT NULL DEFAULT '',
	`clientId` varchar(256) NOT NULL DEFAULT '',
	`clientSecret` varchar(512) NOT NULL DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zoom_settings_id` PRIMARY KEY(`id`)
);
