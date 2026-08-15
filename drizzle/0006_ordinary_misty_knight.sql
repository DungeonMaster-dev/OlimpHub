ALTER TABLE `codeforces_links` ADD `dailySyncEnabled` enum('enabled','disabled') DEFAULT 'disabled' NOT NULL;--> statement-breakpoint
ALTER TABLE `codeforces_links` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `codeforces_links` ADD `dailySyncLastRunAt` timestamp;--> statement-breakpoint
CREATE INDEX `codeforces_links_daily_sync_task_idx` ON `codeforces_links` (`scheduleCronTaskUid`);