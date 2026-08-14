CREATE TABLE `codeforces_rating_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`codeforcesLinkId` int NOT NULL,
	`contestId` int NOT NULL,
	`contestName` varchar(320) NOT NULL,
	`rank` int NOT NULL,
	`oldRating` int NOT NULL,
	`newRating` int NOT NULL,
	`ratedAt` timestamp NOT NULL,
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codeforces_rating_changes_id` PRIMARY KEY(`id`),
	CONSTRAINT `codeforces_rating_user_contest_time_unique` UNIQUE(`userId`,`contestId`,`ratedAt`)
);
--> statement-breakpoint
ALTER TABLE `codeforces_rating_changes` ADD CONSTRAINT `cf_rating_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codeforces_rating_changes` ADD CONSTRAINT `cf_rating_link_fk` FOREIGN KEY (`codeforcesLinkId`) REFERENCES `codeforces_links`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `codeforces_rating_user_rated_idx` ON `codeforces_rating_changes` (`userId`,`ratedAt`);--> statement-breakpoint
CREATE INDEX `codeforces_rating_link_idx` ON `codeforces_rating_changes` (`codeforcesLinkId`);
