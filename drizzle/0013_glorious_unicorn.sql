ALTER TABLE `contest_sessions` MODIFY COLUMN `status` enum('draft','active','completed','expired','archived') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `contest_sessions` ADD `durationMinutes` int DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE `contest_sessions` ADD `expiresAt` timestamp;