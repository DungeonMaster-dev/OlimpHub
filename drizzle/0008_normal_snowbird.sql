CREATE TABLE `skill_graph_versions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `semanticVersion` varchar(32) NOT NULL,
  `status` enum('draft','published','deprecated') NOT NULL DEFAULT 'draft',
  `changeSummary` text NOT NULL,
  `publishedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `skill_graph_versions_id` PRIMARY KEY(`id`),
  CONSTRAINT `skill_graph_versions_semantic_version_unique` UNIQUE(`semanticVersion`)
);
--> statement-breakpoint
INSERT INTO `skill_graph_versions` (`semanticVersion`, `status`, `changeSummary`, `publishedAt`)
VALUES (
  '1.0.0',
  'published',
  'Initial approved algorithm taxonomy: 11 curated foundations, data-structure, search, dynamic-programming and graph skills.' ,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
  `status` = VALUES(`status`),
  `changeSummary` = VALUES(`changeSummary`),
  `publishedAt` = VALUES(`publishedAt`);
--> statement-breakpoint
ALTER TABLE `skills` ADD `graphVersionId` int;
--> statement-breakpoint
UPDATE `skills`
SET `graphVersionId` = (
  SELECT `id`
  FROM `skill_graph_versions`
  WHERE `semanticVersion` = '1.0.0'
  LIMIT 1
)
WHERE `graphVersionId` IS NULL;
--> statement-breakpoint
ALTER TABLE `skills` MODIFY `graphVersionId` int NOT NULL;
--> statement-breakpoint
CREATE INDEX `skill_graph_versions_status_idx` ON `skill_graph_versions` (`status`);
--> statement-breakpoint
ALTER TABLE `skills` ADD CONSTRAINT `skills_graphVersionId_skill_graph_versions_id_fk` FOREIGN KEY (`graphVersionId`) REFERENCES `skill_graph_versions`(`id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `skills_graph_version_idx` ON `skills` (`graphVersionId`);
