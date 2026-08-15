INSERT INTO `skill_graph_versions` (`semanticVersion`, `status`, `changeSummary`, `publishedAt`)
VALUES (
  '1.1.0',
  'published',
  'Adds a curated mathematics taxonomy for future expansion while retaining all approved algorithm skills; no automatic recommendations or source mappings are enabled.',
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
  `status` = VALUES(`status`),
  `changeSummary` = VALUES(`changeSummary`),
  `publishedAt` = VALUES(`publishedAt`);
--> statement-breakpoint
INSERT INTO `skills` (`stableKey`, `title`, `description`, `domain`, `color`, `status`, `graphVersionId`)
SELECT seed.`stableKey`, seed.`title`, seed.`description`, 'mathematics', '#f5b971', 'approved', version.`id`
FROM (
  SELECT 'mathematics.algebra.polynomials' AS `stableKey`, 'Polynomial methods' AS `title`, 'Transform polynomial expressions using factorization, roots and coefficient structure.' AS `description`
  UNION ALL SELECT 'mathematics.algebra.inequalities', 'Inequalities', 'Bound expressions with equality cases and appropriate inequality tools.'
  UNION ALL SELECT 'mathematics.number-theory.gcd', 'GCD and divisibility', 'Use divisibility, gcd structure and Euclidean-algorithm reasoning.'
  UNION ALL SELECT 'mathematics.number-theory.modular-arithmetic', 'Modular arithmetic', 'Reason about congruences, residues and modular transformations.'
  UNION ALL SELECT 'mathematics.combinatorics.counting', 'Combinatorial counting', 'Count finite objects using bijections, cases and standard counting principles.'
  UNION ALL SELECT 'mathematics.combinatorics.pigeonhole', 'Pigeonhole principle', 'Force a repeated structure by comparing objects with available containers.'
  UNION ALL SELECT 'mathematics.geometry.similarity', 'Geometric similarity', 'Use similarity, angle structure and ratios in Euclidean geometry.'
  UNION ALL SELECT 'mathematics.probability.expected-value', 'Expected value', 'Model random quantities and apply linearity of expectation.'
  UNION ALL SELECT 'mathematics.proof.induction', 'Proof by induction', 'Structure a base case and inductive step for a quantified claim.'
) AS seed
CROSS JOIN `skill_graph_versions` AS version
WHERE version.`semanticVersion` = '1.1.0'
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `description` = VALUES(`description`),
  `color` = VALUES(`color`),
  `status` = VALUES(`status`);
--> statement-breakpoint
INSERT INTO `skill_graph_memberships` (`graphVersionId`, `skillId`)
SELECT version.`id`, skill.`id`
FROM `skill_graph_versions` AS version
CROSS JOIN `skills` AS skill
WHERE version.`semanticVersion` = '1.1.0'
ON DUPLICATE KEY UPDATE `skillId` = VALUES(`skillId`);
