CREATE TABLE `skill_edge_graph_memberships` (
  `id` int AUTO_INCREMENT NOT NULL,
  `graphVersionId` int NOT NULL,
  `skillEdgeId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `skill_edge_graph_memberships_id` PRIMARY KEY(`id`),
  CONSTRAINT `skill_edge_graph_memberships_version_edge_unique` UNIQUE(`graphVersionId`,`skillEdgeId`)
);
--> statement-breakpoint
ALTER TABLE `skill_edge_graph_memberships` ADD CONSTRAINT `segm_graph_version_fk` FOREIGN KEY (`graphVersionId`) REFERENCES `skill_graph_versions`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `skill_edge_graph_memberships` ADD CONSTRAINT `segm_skill_edge_fk` FOREIGN KEY (`skillEdgeId`) REFERENCES `skill_edges`(`id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `skill_edge_graph_memberships_edge_idx` ON `skill_edge_graph_memberships` (`skillEdgeId`);
--> statement-breakpoint
INSERT INTO `skill_edge_graph_memberships` (`graphVersionId`, `skillEdgeId`)
SELECT version.`id`, edge.`id`
FROM `skill_graph_versions` AS version
INNER JOIN `skill_graph_memberships` AS source_member
  ON source_member.`graphVersionId` = version.`id`
INNER JOIN `skill_graph_memberships` AS target_member
  ON target_member.`graphVersionId` = version.`id`
INNER JOIN `skill_edges` AS edge
  ON edge.`fromSkillId` = source_member.`skillId`
 AND edge.`toSkillId` = target_member.`skillId`
ON DUPLICATE KEY UPDATE `skillEdgeId` = VALUES(`skillEdgeId`);
