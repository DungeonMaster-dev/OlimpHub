CREATE TABLE `activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attemptId` int,
	`problemId` int,
	`eventType` varchar(80) NOT NULL,
	`clientEventId` varchar(96),
	`metadata` json NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_events_user_client_unique` UNIQUE(`userId`,`clientEventId`)
);
--> statement-breakpoint
CREATE TABLE `analytics_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`snapshotId` int NOT NULL,
	`metricKey` varchar(80) NOT NULL,
	`reasonCode` varchar(80) NOT NULL,
	`detail` text NOT NULL,
	`eventId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`periodDays` int NOT NULL,
	`calculationVersion` varchar(32) NOT NULL,
	`metrics` json NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codeforces_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`handle` varchar(64) NOT NULL,
	`normalizedHandle` varchar(64) NOT NULL,
	`verificationStatus` enum('declared_public','verified','stale','revoked') NOT NULL DEFAULT 'declared_public',
	`syncConsent` enum('enabled','disabled') NOT NULL DEFAULT 'enabled',
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codeforces_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `codeforces_links_user_unique` UNIQUE(`userId`),
	CONSTRAINT `codeforces_links_handle_unique` UNIQUE(`normalizedHandle`)
);
--> statement-breakpoint
CREATE TABLE `external_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceId` varchar(64) NOT NULL DEFAULT 'codeforces',
	`externalSubmissionId` varchar(96) NOT NULL,
	`problemId` int,
	`externalProblemKey` varchar(180) NOT NULL,
	`verdict` varchar(64) NOT NULL,
	`language` varchar(120),
	`submittedAt` timestamp NOT NULL,
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_submissions_source_external_unique` UNIQUE(`sourceId`,`externalSubmissionId`)
);
--> statement-breakpoint
CREATE TABLE `problem_hints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`problemId` int NOT NULL,
	`level` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problem_hints_id` PRIMARY KEY(`id`),
	CONSTRAINT `problem_hints_problem_level_unique` UNIQUE(`problemId`,`level`)
);
--> statement-breakpoint
CREATE TABLE `problem_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problemId` int NOT NULL,
	`attemptId` int,
	`content` text NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problem_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `problem_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`problemId` int NOT NULL,
	`skillId` int NOT NULL,
	`relevance` enum('primary','supporting','related') NOT NULL DEFAULT 'supporting',
	`origin` enum('source_tag_rule','curator') NOT NULL DEFAULT 'source_tag_rule',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `problem_skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `problem_skills_unique` UNIQUE(`problemId`,`skillId`)
);
--> statement-breakpoint
CREATE TABLE `problems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`externalKey` varchar(180) NOT NULL,
	`title` varchar(320) NOT NULL,
	`sourceUrl` varchar(1000) NOT NULL,
	`difficulty` int,
	`tags` json NOT NULL,
	`accessMode` enum('external_link','metadata_only','licensed_local_content','restricted') NOT NULL DEFAULT 'external_link',
	`sourceUpdatedAt` timestamp,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problems_id` PRIMARY KEY(`id`),
	CONSTRAINT `problems_source_external_unique` UNIQUE(`sourceId`,`externalKey`)
);
--> statement-breakpoint
CREATE TABLE `skill_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromSkillId` int NOT NULL,
	`toSkillId` int NOT NULL,
	`relationType` enum('prerequisite_of','related_to','refines') NOT NULL,
	`strength` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_edges_id` PRIMARY KEY(`id`),
	CONSTRAINT `skill_edges_unique_relation` UNIQUE(`fromSkillId`,`toSkillId`,`relationType`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stableKey` varchar(180) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`domain` enum('algorithms','mathematics','practice') NOT NULL DEFAULT 'algorithms',
	`color` varchar(16) NOT NULL DEFAULT '#6170ff',
	`status` enum('draft','approved','deprecated') NOT NULL DEFAULT 'approved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `skills_stable_key_unique` UNIQUE(`stableKey`)
);
--> statement-breakpoint
CREATE TABLE `solving_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problemId` int NOT NULL,
	`state` enum('active','paused','completed','abandoned') NOT NULL DEFAULT 'active',
	`outcome` enum('solved','not_solved','partial','unknown') NOT NULL DEFAULT 'unknown',
	`highestHintLevel` int NOT NULL DEFAULT -1,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`pausedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `solving_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `source_sync_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`scopeKey` varchar(180) NOT NULL,
	`status` enum('idle','running','succeeded','failed','rate_limited') NOT NULL DEFAULT 'idle',
	`cursor` varchar(255),
	`lastError` text,
	`lastStartedAt` timestamp,
	`lastFinishedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `source_sync_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_sync_states_source_scope_unique` UNIQUE(`sourceId`,`scopeKey`)
);
--> statement-breakpoint
CREATE TABLE `training_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`problemId` int NOT NULL,
	`position` int NOT NULL,
	`status` enum('queued','active','completed','skipped') NOT NULL DEFAULT 'queued',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_items_session_position_unique` UNIQUE(`sessionId`,`position`),
	CONSTRAINT `training_items_session_problem_unique` UNIQUE(`sessionId`,`problemId`)
);
--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`status` enum('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_problem_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`problemId` int NOT NULL,
	`status` enum('not_started','planned','in_progress','paused','solved','review','skipped','archived') NOT NULL DEFAULT 'not_started',
	`sourceOfTruth` enum('user_declared','external_observation','system_projection') NOT NULL DEFAULT 'user_declared',
	`firstStartedAt` timestamp,
	`lastActivityAt` timestamp,
	`solvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_problem_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `progress_user_problem_unique` UNIQUE(`userId`,`problemId`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`timeZone` varchar(64) NOT NULL DEFAULT 'UTC',
	`weeklyGoal` int NOT NULL DEFAULT 4,
	`activityTracking` enum('enabled','minimal') NOT NULL DEFAULT 'enabled',
	`notificationOptIn` enum('enabled','disabled') NOT NULL DEFAULT 'disabled',
	`analyticsPeriodDays` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `activity_events` ADD CONSTRAINT `activity_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_events` ADD CONSTRAINT `activity_events_attemptId_solving_attempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `solving_attempts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_events` ADD CONSTRAINT `activity_events_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_evidence` ADD CONSTRAINT `analytics_evidence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_evidence` ADD CONSTRAINT `analytics_evidence_snapshotId_analytics_snapshots_id_fk` FOREIGN KEY (`snapshotId`) REFERENCES `analytics_snapshots`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_evidence` ADD CONSTRAINT `analytics_evidence_eventId_activity_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `activity_events`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_snapshots` ADD CONSTRAINT `analytics_snapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codeforces_links` ADD CONSTRAINT `codeforces_links_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `external_submissions` ADD CONSTRAINT `external_submissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `external_submissions` ADD CONSTRAINT `external_submissions_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_hints` ADD CONSTRAINT `problem_hints_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_notes` ADD CONSTRAINT `problem_notes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_notes` ADD CONSTRAINT `problem_notes_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_notes` ADD CONSTRAINT `problem_notes_attemptId_solving_attempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `solving_attempts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_skills` ADD CONSTRAINT `problem_skills_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_skills` ADD CONSTRAINT `problem_skills_skillId_skills_id_fk` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_edges` ADD CONSTRAINT `skill_edges_fromSkillId_skills_id_fk` FOREIGN KEY (`fromSkillId`) REFERENCES `skills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_edges` ADD CONSTRAINT `skill_edges_toSkillId_skills_id_fk` FOREIGN KEY (`toSkillId`) REFERENCES `skills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solving_attempts` ADD CONSTRAINT `solving_attempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solving_attempts` ADD CONSTRAINT `solving_attempts_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_items` ADD CONSTRAINT `training_items_sessionId_training_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_items` ADD CONSTRAINT `training_items_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `training_sessions` ADD CONSTRAINT `training_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_problem_progress` ADD CONSTRAINT `user_problem_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_problem_progress` ADD CONSTRAINT `user_problem_progress_problemId_problems_id_fk` FOREIGN KEY (`problemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_events_user_occurred_idx` ON `activity_events` (`userId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `analytics_evidence_snapshot_metric_idx` ON `analytics_evidence` (`snapshotId`,`metricKey`);--> statement-breakpoint
CREATE INDEX `analytics_snapshots_user_period_idx` ON `analytics_snapshots` (`userId`,`periodDays`,`generatedAt`);--> statement-breakpoint
CREATE INDEX `external_submissions_user_submitted_idx` ON `external_submissions` (`userId`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `notes_user_problem_idx` ON `problem_notes` (`userId`,`problemId`);--> statement-breakpoint
CREATE INDEX `problem_skills_skill_idx` ON `problem_skills` (`skillId`);--> statement-breakpoint
CREATE INDEX `problems_source_difficulty_idx` ON `problems` (`sourceId`,`difficulty`);--> statement-breakpoint
CREATE INDEX `problems_title_idx` ON `problems` (`title`);--> statement-breakpoint
CREATE INDEX `skill_edges_to_idx` ON `skill_edges` (`toSkillId`);--> statement-breakpoint
CREATE INDEX `attempts_user_state_idx` ON `solving_attempts` (`userId`,`state`);--> statement-breakpoint
CREATE INDEX `attempts_problem_idx` ON `solving_attempts` (`problemId`);--> statement-breakpoint
CREATE INDEX `training_sessions_user_status_idx` ON `training_sessions` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `progress_user_status_idx` ON `user_problem_progress` (`userId`,`status`);