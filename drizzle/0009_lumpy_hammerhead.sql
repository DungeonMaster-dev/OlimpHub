CREATE TABLE `skill_graph_memberships` (
  `id` int AUTO_INCREMENT NOT NULL,
  `graphVersionId` int NOT NULL,
  `skillId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `skill_graph_memberships_id` PRIMARY KEY(`id`),
  CONSTRAINT `skill_graph_memberships_version_skill_unique` UNIQUE(`graphVersionId`,`skillId`)
);
--> statement-breakpoint
ALTER TABLE `skill_graph_memberships` ADD CONSTRAINT `sgm_graph_version_fk` FOREIGN KEY (`graphVersionId`) REFERENCES `skill_graph_versions`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `skill_graph_memberships` ADD CONSTRAINT `sgm_skill_fk` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `skill_graph_memberships_skill_idx` ON `skill_graph_memberships` (`skillId`);
--> statement-breakpoint
INSERT INTO `skill_graph_memberships` (`graphVersionId`, `skillId`)
SELECT `graphVersionId`, `id`
FROM `skills`
ON DUPLICATE KEY UPDATE `skillId` = VALUES(`skillId`);
