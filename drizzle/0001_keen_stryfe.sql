CREATE TABLE `auto_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`matchType` enum('exact','partial') NOT NULL DEFAULT 'partial',
	`replyType` enum('text','image','template') NOT NULL DEFAULT 'text',
	`replyContent` text NOT NULL,
	`replyImageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','editor','viewer') NOT NULL DEFAULT 'editor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`industry` enum('personal_training','beauty_salon','seitai','pilates','yoga','dental','clinic','restaurant','retail','other') NOT NULL DEFAULT 'other',
	`contactName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`status` enum('active','inactive','trial') NOT NULL DEFAULT 'trial',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `friends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`lineUserId` varchar(128) NOT NULL,
	`displayName` varchar(255),
	`pictureUrl` text,
	`statusMessage` text,
	`status` enum('active','blocked','unfollowed') NOT NULL DEFAULT 'active',
	`tags` json,
	`notes` text,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`lastInteraction` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `greeting_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`messageContent` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `greeting_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `industry_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`industry` enum('personal_training','beauty_salon','seitai','pilates','yoga','dental','clinic','restaurant','retail','other') NOT NULL,
	`templateType` enum('auto_reply','rich_menu','step_scenario','greeting') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `industry_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `line_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`channelName` varchar(255),
	`channelId` varchar(128),
	`channelSecret` varchar(255),
	`channelAccessToken` text,
	`webhookUrl` text,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `line_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`messageType` enum('broadcast','auto_reply','step','manual') NOT NULL DEFAULT 'manual',
	`recipientCount` int NOT NULL DEFAULT 0,
	`messageContent` text,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rich_menus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`imageUrl` text,
	`menuSize` enum('large','small') NOT NULL DEFAULT 'large',
	`areas` json,
	`isActive` boolean NOT NULL DEFAULT false,
	`lineRichMenuId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rich_menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `step_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`delayHours` int NOT NULL DEFAULT 0,
	`messageType` enum('text','image','template') NOT NULL DEFAULT 'text',
	`messageContent` text NOT NULL,
	`messageImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `step_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `step_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` enum('friend_add','keyword','manual') NOT NULL DEFAULT 'friend_add',
	`triggerKeyword` varchar(255),
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `step_scenarios_id` PRIMARY KEY(`id`)
);
