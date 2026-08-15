CREATE TABLE `contest_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`problemId` int NOT NULL,
	`position` int NOT NULL,
	`status` enum('queued','active','completed','skipped') NOT NULL DEFAULT 'queued',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contest_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `contest_items_session_position_unique` UNIQUE(`sessionId`,`position`),
	CONSTRAINT `contest_items_session_problem_unique` UNIQUE(`sessionId`,`problemId`)
);
--> statement-breakpoint
CREATE TABLE `contest_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`status` enum('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contest_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contest_items` ADD CONSTRAINT `contest_items_sessionId_contest_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `contest_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contest_items` ADD CONSTRAINT `contest_items_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contest_sessions` ADD CONSTRAINT `contest_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contest_sessions_user_status_idx` ON `contest_sessions` (`userId`,`status`);