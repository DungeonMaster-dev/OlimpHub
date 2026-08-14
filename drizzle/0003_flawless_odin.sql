CREATE TABLE `idempotency_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`operation` varchar(80) NOT NULL,
	`requestId` varchar(96) NOT NULL,
	`ownerToken` varchar(96) NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`response` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `idempotency_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `idempotency_receipts_user_operation_request_unique` UNIQUE(`userId`,`operation`,`requestId`)
);
--> statement-breakpoint
ALTER TABLE `idempotency_receipts` ADD CONSTRAINT `idempotency_receipts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idempotency_receipts_user_created_idx` ON `idempotency_receipts` (`userId`,`createdAt`);