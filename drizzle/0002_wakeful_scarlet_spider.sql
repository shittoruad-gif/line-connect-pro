CREATE TABLE `chatbot_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`clientId` int NOT NULL,
	`friendId` int,
	`lineUserId` varchar(128),
	`nodeId` int,
	`userMessage` text,
	`botMessage` text,
	`selectedChoice` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbot_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`nodeType` enum('message','choices','ai_response','condition','action') NOT NULL DEFAULT 'message',
	`label` varchar(255) NOT NULL,
	`messageContent` text,
	`choices` json,
	`condition` json,
	`actionType` varchar(64),
	`actionData` json,
	`nextNodeId` int,
	`positionX` int NOT NULL DEFAULT 0,
	`positionY` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerKeyword` varchar(255),
	`isActive` boolean NOT NULL DEFAULT false,
	`useAi` boolean NOT NULL DEFAULT false,
	`aiSystemPrompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_scenarios_id` PRIMARY KEY(`id`)
);
