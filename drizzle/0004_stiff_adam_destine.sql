CREATE TABLE `problem_relations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leftProblemId` int NOT NULL,
	`rightProblemId` int NOT NULL,
	`relationType` enum('same_problem','translation_of','adapted_from','duplicate_candidate','prerequisite','follow_up','variant_of') NOT NULL,
	`confidence` int NOT NULL DEFAULT 100,
	`origin` enum('source_evidence','curator') NOT NULL DEFAULT 'curator',
	`reviewStatus` enum('proposed','approved','rejected') NOT NULL DEFAULT 'proposed',
	`createdByUserId` int,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problem_relations_id` PRIMARY KEY(`id`),
	CONSTRAINT `problem_relations_unique` UNIQUE(`leftProblemId`,`rightProblemId`,`relationType`)
);
--> statement-breakpoint
ALTER TABLE `problems` ADD `canonicalizationStatus` enum('source_distinct','candidate_duplicate','linked_duplicate','canonical') DEFAULT 'source_distinct' NOT NULL;--> statement-breakpoint
ALTER TABLE `problem_relations` ADD CONSTRAINT `problem_relations_leftProblemId_problems_id_fk` FOREIGN KEY (`leftProblemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_relations` ADD CONSTRAINT `problem_relations_rightProblemId_problems_id_fk` FOREIGN KEY (`rightProblemId`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_relations` ADD CONSTRAINT `problem_relations_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_relations` ADD CONSTRAINT `problem_relations_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `problem_relations_left_idx` ON `problem_relations` (`leftProblemId`);--> statement-breakpoint
CREATE INDEX `problem_relations_right_idx` ON `problem_relations` (`rightProblemId`);--> statement-breakpoint
CREATE INDEX `problem_relations_review_idx` ON `problem_relations` (`reviewStatus`);