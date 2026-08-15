CREATE TABLE `ai_observability_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`operation` varchar(96) NOT NULL,
	`model` varchar(128),
	`outcome` enum('succeeded','failed') NOT NULL,
	`latencyMs` int NOT NULL,
	`costMicrounits` int,
	`errorCode` varchar(96),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_observability_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_observability_events` ADD CONSTRAINT `ai_observability_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_observability_user_occurred_idx` ON `ai_observability_events` (`userId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `ai_observability_operation_idx` ON `ai_observability_events` (`operation`);