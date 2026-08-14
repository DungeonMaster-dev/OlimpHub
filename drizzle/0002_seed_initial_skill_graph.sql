INSERT INTO `skills` (`stableKey`, `title`, `description`, `domain`, `color`, `status`) VALUES
  ('foundations.complexity', 'Complexity analysis', 'Reason about time and memory bounds before selecting an approach.', 'algorithms', '#9fa9ff', 'approved'),
  ('foundations.invariants', 'Invariants', 'State the condition that must remain true throughout an algorithm.', 'algorithms', '#9fa9ff', 'approved'),
  ('foundations.bit-operations', 'Bit operations', 'Use binary representation and bitwise transformations deliberately.', 'algorithms', '#9fa9ff', 'approved'),
  ('data-structures.heap', 'Priority queues', 'Use heap ordering to repeatedly select the next best element.', 'algorithms', '#73d7ff', 'approved'),
  ('data-structures.range.prefix-sums', 'Prefix sums', 'Precompute associative ranges for fast query answers.', 'algorithms', '#73d7ff', 'approved'),
  ('data-structures.range.segment-tree', 'Segment trees', 'Maintain range aggregates under updates with explicit node invariants.', 'algorithms', '#73d7ff', 'approved'),
  ('algorithms.search-and-order.binary-search', 'Binary search', 'Reduce a monotone search space while preserving an answer invariant.', 'algorithms', '#c4a7ff', 'approved'),
  ('algorithms.dynamic-programming.state-design', 'DP state design', 'Choose a compact state that captures all decision-relevant history.', 'algorithms', '#c4a7ff', 'approved'),
  ('algorithms.dynamic-programming.bitmask', 'Bitmask DP', 'Encode a subset in a bit mask and derive transitions over subsets.', 'algorithms', '#c4a7ff', 'approved'),
  ('algorithms.graphs.traversal', 'Graph traversal', 'Explore reachability and graph structure with BFS or DFS.', 'algorithms', '#6ee7c8', 'approved'),
  ('algorithms.graphs.shortest-paths.dijkstra', 'Dijkstra shortest paths', 'Find non-negative weighted shortest paths with a priority queue.', 'algorithms', '#6ee7c8', 'approved')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`), `color` = VALUES(`color`), `status` = VALUES(`status`);

INSERT INTO `skill_edges` (`fromSkillId`, `toSkillId`, `relationType`, `strength`)
SELECT prerequisite.id, target.id, 'prerequisite_of', 80
FROM `skills` prerequisite CROSS JOIN `skills` target
WHERE (prerequisite.`stableKey`, target.`stableKey`) IN (
  ('foundations.complexity', 'algorithms.graphs.shortest-paths.dijkstra'),
  ('data-structures.heap', 'algorithms.graphs.shortest-paths.dijkstra'),
  ('algorithms.graphs.traversal', 'algorithms.graphs.shortest-paths.dijkstra'),
  ('foundations.bit-operations', 'algorithms.dynamic-programming.bitmask'),
  ('algorithms.dynamic-programming.state-design', 'algorithms.dynamic-programming.bitmask'),
  ('foundations.invariants', 'data-structures.range.segment-tree'),
  ('data-structures.range.prefix-sums', 'data-structures.range.segment-tree')
)
ON DUPLICATE KEY UPDATE `strength` = VALUES(`strength`);
