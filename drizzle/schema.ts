import {
  index,
  int,
  json,
  foreignKey,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userSettings = mysqlTable(
  "user_settings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    timeZone: varchar("timeZone", { length: 64 }).default("UTC").notNull(),
    weeklyGoal: int("weeklyGoal").default(4).notNull(),
    activityTracking: mysqlEnum("activityTracking", ["enabled", "minimal"])
      .default("enabled")
      .notNull(),
    notificationOptIn: mysqlEnum("notificationOptIn", ["enabled", "disabled"])
      .default("disabled")
      .notNull(),
    analyticsPeriodDays: int("analyticsPeriodDays").default(30).notNull(),
    analyticsRetentionDays: int("analyticsRetentionDays").default(90).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("user_settings_user_unique").on(table.userId)]
);

export const skillGraphVersions = mysqlTable(
  "skill_graph_versions",
  {
    id: int("id").autoincrement().primaryKey(),
    semanticVersion: varchar("semanticVersion", { length: 32 }).notNull(),
    status: mysqlEnum("status", ["draft", "published", "deprecated"])
      .default("draft")
      .notNull(),
    changeSummary: text("changeSummary").notNull(),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("skill_graph_versions_semantic_version_unique").on(
      table.semanticVersion
    ),
    index("skill_graph_versions_status_idx").on(table.status),
  ]
);

export const skills = mysqlTable(
  "skills",
  {
    id: int("id").autoincrement().primaryKey(),
    stableKey: varchar("stableKey", { length: 180 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    domain: mysqlEnum("domain", ["algorithms", "mathematics", "practice"])
      .default("algorithms")
      .notNull(),
    introducedInGraphVersionId: int("graphVersionId")
      .notNull()
      .references(() => skillGraphVersions.id, { onDelete: "restrict" }),
    color: varchar("color", { length: 16 }).default("#6170ff").notNull(),
    status: mysqlEnum("status", ["draft", "approved", "deprecated"])
      .default("approved")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("skills_stable_key_unique").on(table.stableKey),
    index("skills_graph_version_idx").on(table.introducedInGraphVersionId),
  ]
);

export const skillGraphMemberships = mysqlTable(
  "skill_graph_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    graphVersionId: int("graphVersionId")
      .notNull()
      .references(() => skillGraphVersions.id, { onDelete: "cascade" }),
    skillId: int("skillId")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("skill_graph_memberships_version_skill_unique").on(
      table.graphVersionId,
      table.skillId
    ),
    index("skill_graph_memberships_skill_idx").on(table.skillId),
  ]
);

export const skillEdges = mysqlTable(
  "skill_edges",
  {
    id: int("id").autoincrement().primaryKey(),
    fromSkillId: int("fromSkillId")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    toSkillId: int("toSkillId")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    relationType: mysqlEnum("relationType", [
      "prerequisite_of",
      "related_to",
      "refines",
    ]).notNull(),
    strength: int("strength").default(50).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("skill_edges_unique_relation").on(
      table.fromSkillId,
      table.toSkillId,
      table.relationType
    ),
    index("skill_edges_to_idx").on(table.toSkillId),
  ]
);

export const skillEdgeGraphMemberships = mysqlTable(
  "skill_edge_graph_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    graphVersionId: int("graphVersionId")
      .notNull()
      .references(() => skillGraphVersions.id, { onDelete: "cascade" }),
    skillEdgeId: int("skillEdgeId")
      .notNull()
      .references(() => skillEdges.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("skill_edge_graph_memberships_version_edge_unique").on(
      table.graphVersionId,
      table.skillEdgeId
    ),
    index("skill_edge_graph_memberships_edge_idx").on(table.skillEdgeId),
  ]
);

export const problems = mysqlTable(
  "problems",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceId: varchar("sourceId", { length: 64 }).notNull(),
    externalKey: varchar("externalKey", { length: 180 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
    difficulty: int("difficulty"),
    tags: json("tags").$type<string[]>().notNull(),
    accessMode: mysqlEnum("accessMode", [
      "external_link",
      "metadata_only",
      "licensed_local_content",
      "restricted",
    ])
      .default("external_link")
      .notNull(),
    canonicalizationStatus: mysqlEnum("canonicalizationStatus", [
      "source_distinct",
      "candidate_duplicate",
      "linked_duplicate",
      "canonical",
    ])
      .default("source_distinct")
      .notNull(),
    sourceUpdatedAt: timestamp("sourceUpdatedAt"),
    importedAt: timestamp("importedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("problems_source_external_unique").on(
      table.sourceId,
      table.externalKey
    ),
    index("problems_source_difficulty_idx").on(
      table.sourceId,
      table.difficulty
    ),
    index("problems_title_idx").on(table.title),
  ]
);

export const problemRelations = mysqlTable(
  "problem_relations",
  {
    id: int("id").autoincrement().primaryKey(),
    leftProblemId: int("leftProblemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    rightProblemId: int("rightProblemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    relationType: mysqlEnum("relationType", [
      "same_problem",
      "translation_of",
      "adapted_from",
      "duplicate_candidate",
      "prerequisite",
      "follow_up",
      "variant_of",
    ]).notNull(),
    confidence: int("confidence").default(100).notNull(),
    origin: mysqlEnum("origin", ["source_evidence", "curator"])
      .default("curator")
      .notNull(),
    reviewStatus: mysqlEnum("reviewStatus", [
      "proposed",
      "approved",
      "rejected",
    ])
      .default("proposed")
      .notNull(),
    createdByUserId: int("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("problem_relations_unique").on(
      table.leftProblemId,
      table.rightProblemId,
      table.relationType
    ),
    index("problem_relations_left_idx").on(table.leftProblemId),
    index("problem_relations_right_idx").on(table.rightProblemId),
    index("problem_relations_review_idx").on(table.reviewStatus),
  ]
);

export const problemSkills = mysqlTable(
  "problem_skills",
  {
    id: int("id").autoincrement().primaryKey(),
    problemId: int("problemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    skillId: int("skillId")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    relevance: mysqlEnum("relevance", ["primary", "supporting", "related"])
      .default("supporting")
      .notNull(),
    origin: mysqlEnum("origin", ["source_tag_rule", "curator"])
      .default("source_tag_rule")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("problem_skills_unique").on(table.problemId, table.skillId),
    index("problem_skills_skill_idx").on(table.skillId),
  ]
);

export const userProblemProgress = mysqlTable(
  "user_problem_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: int("problemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", [
      "not_started",
      "planned",
      "in_progress",
      "paused",
      "solved",
      "review",
      "skipped",
      "archived",
    ])
      .default("not_started")
      .notNull(),
    sourceOfTruth: mysqlEnum("sourceOfTruth", [
      "user_declared",
      "external_observation",
      "system_projection",
    ])
      .default("user_declared")
      .notNull(),
    firstStartedAt: timestamp("firstStartedAt"),
    lastActivityAt: timestamp("lastActivityAt"),
    solvedAt: timestamp("solvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("progress_user_problem_unique").on(
      table.userId,
      table.problemId
    ),
    index("progress_user_status_idx").on(table.userId, table.status),
  ]
);

export const solvingAttempts = mysqlTable(
  "solving_attempts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: int("problemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    state: mysqlEnum("state", ["active", "paused", "completed", "abandoned"])
      .default("active")
      .notNull(),
    outcome: mysqlEnum("outcome", [
      "solved",
      "not_solved",
      "partial",
      "unknown",
    ])
      .default("unknown")
      .notNull(),
    highestHintLevel: int("highestHintLevel").default(-1).notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    pausedAt: timestamp("pausedAt"),
    endedAt: timestamp("endedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("attempts_user_state_idx").on(table.userId, table.state),
    index("attempts_problem_idx").on(table.problemId),
  ]
);

export const problemNotes = mysqlTable(
  "problem_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: int("problemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    attemptId: int("attemptId").references(() => solvingAttempts.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    revision: int("revision").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("notes_user_problem_idx").on(table.userId, table.problemId)]
);

export const problemHints = mysqlTable(
  "problem_hints",
  {
    id: int("id").autoincrement().primaryKey(),
    problemId: int("problemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    level: int("level").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("problem_hints_problem_level_unique").on(
      table.problemId,
      table.level
    ),
  ]
);

export const activityEvents = mysqlTable(
  "activity_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attemptId: int("attemptId").references(() => solvingAttempts.id, {
      onDelete: "set null",
    }),
    problemId: int("problemId").references(() => problems.id, {
      onDelete: "set null",
    }),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    clientEventId: varchar("clientEventId", { length: 96 }),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("activity_events_user_client_unique").on(
      table.userId,
      table.clientEventId
    ),
    index("activity_events_user_occurred_idx").on(
      table.userId,
      table.occurredAt
    ),
  ]
);

export const idempotencyReceipts = mysqlTable(
  "idempotency_receipts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    operation: varchar("operation", { length: 80 }).notNull(),
    requestId: varchar("requestId", { length: 96 }).notNull(),
    ownerToken: varchar("ownerToken", { length: 96 }).notNull(),
    status: mysqlEnum("status", ["pending", "completed", "failed"])
      .default("pending")
      .notNull(),
    response: json("response").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("idempotency_receipts_user_operation_request_unique").on(
      table.userId,
      table.operation,
      table.requestId
    ),
    index("idempotency_receipts_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
);

export const trainingSessions = mysqlTable(
  "training_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    status: mysqlEnum("status", ["draft", "active", "completed", "archived"])
      .default("draft")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("training_sessions_user_status_idx").on(table.userId, table.status),
  ]
);

export const trainingItems = mysqlTable(
  "training_items",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    problemId: int("problemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    position: int("position").notNull(),
    status: mysqlEnum("status", ["queued", "active", "completed", "skipped"])
      .default("queued")
      .notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("training_items_session_position_unique").on(
      table.sessionId,
      table.position
    ),
    uniqueIndex("training_items_session_problem_unique").on(
      table.sessionId,
      table.problemId
    ),
  ]
);

export const contestSessions = mysqlTable(
  "contest_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    status: mysqlEnum("status", [
      "draft",
      "active",
      "completed",
      "expired",
      "archived",
    ])
      .default("draft")
      .notNull(),
    durationMinutes: int("durationMinutes").default(120).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    startedAt: timestamp("startedAt"),
    expiresAt: timestamp("expiresAt"),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("contest_sessions_user_status_idx").on(table.userId, table.status),
  ]
);

export const contestItems = mysqlTable(
  "contest_items",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId")
      .notNull()
      .references(() => contestSessions.id, { onDelete: "cascade" }),
    problemId: int("problemId")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    position: int("position").notNull(),
    status: mysqlEnum("status", ["queued", "active", "completed", "skipped"])
      .default("queued")
      .notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("contest_items_session_position_unique").on(
      table.sessionId,
      table.position
    ),
    uniqueIndex("contest_items_session_problem_unique").on(
      table.sessionId,
      table.problemId
    ),
  ]
);

export const analyticsSnapshots = mysqlTable(
  "analytics_snapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodDays: int("periodDays").notNull(),
    calculationVersion: varchar("calculationVersion", { length: 32 }).notNull(),
    metrics: json("metrics")
      .$type<Record<string, number | string | boolean>>()
      .notNull(),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  },
  table => [
    index("analytics_snapshots_user_period_idx").on(
      table.userId,
      table.periodDays,
      table.generatedAt
    ),
  ]
);

export const analyticsEvidence = mysqlTable(
  "analytics_evidence",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    snapshotId: int("snapshotId")
      .notNull()
      .references(() => analyticsSnapshots.id, { onDelete: "cascade" }),
    metricKey: varchar("metricKey", { length: 80 }).notNull(),
    reasonCode: varchar("reasonCode", { length: 80 }).notNull(),
    detail: text("detail").notNull(),
    eventId: int("eventId").references(() => activityEvents.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("analytics_evidence_snapshot_metric_idx").on(
      table.snapshotId,
      table.metricKey
    ),
  ]
);

export const codeforcesLinks = mysqlTable(
  "codeforces_links",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: varchar("handle", { length: 64 }).notNull(),
    normalizedHandle: varchar("normalizedHandle", { length: 64 }).notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "declared_public",
      "verified",
      "stale",
      "revoked",
    ])
      .default("declared_public")
      .notNull(),
    syncConsent: mysqlEnum("syncConsent", ["enabled", "disabled"])
      .default("enabled")
      .notNull(),
    dailySyncEnabled: mysqlEnum("dailySyncEnabled", ["enabled", "disabled"])
      .default("disabled")
      .notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    dailySyncLastRunAt: timestamp("dailySyncLastRunAt"),
    lastSyncedAt: timestamp("lastSyncedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("codeforces_links_user_unique").on(table.userId),
    uniqueIndex("codeforces_links_handle_unique").on(table.normalizedHandle),
    index("codeforces_links_daily_sync_task_idx").on(table.scheduleCronTaskUid),
  ]
);

export const codeforcesRatingChanges = mysqlTable(
  "codeforces_rating_changes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    codeforcesLinkId: int("codeforcesLinkId").notNull(),
    contestId: int("contestId").notNull(),
    contestName: varchar("contestName", { length: 320 }).notNull(),
    rank: int("rank").notNull(),
    oldRating: int("oldRating").notNull(),
    newRating: int("newRating").notNull(),
    ratedAt: timestamp("ratedAt").notNull(),
    observedAt: timestamp("observedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("codeforces_rating_user_contest_time_unique").on(
      table.userId,
      table.contestId,
      table.ratedAt
    ),
    index("codeforces_rating_user_rated_idx").on(table.userId, table.ratedAt),
    index("codeforces_rating_link_idx").on(table.codeforcesLinkId),
    foreignKey({
      name: "cf_rating_user_fk",
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "cf_rating_link_fk",
      columns: [table.codeforcesLinkId],
      foreignColumns: [codeforcesLinks.id],
    }).onDelete("cascade"),
  ]
);

export const externalSubmissions = mysqlTable(
  "external_submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceId: varchar("sourceId", { length: 64 })
      .default("codeforces")
      .notNull(),
    externalSubmissionId: varchar("externalSubmissionId", {
      length: 96,
    }).notNull(),
    problemId: int("problemId").references(() => problems.id, {
      onDelete: "set null",
    }),
    externalProblemKey: varchar("externalProblemKey", {
      length: 180,
    }).notNull(),
    verdict: varchar("verdict", { length: 64 }).notNull(),
    language: varchar("language", { length: 120 }),
    submittedAt: timestamp("submittedAt").notNull(),
    observedAt: timestamp("observedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("external_submissions_source_external_unique").on(
      table.sourceId,
      table.externalSubmissionId
    ),
    index("external_submissions_user_submitted_idx").on(
      table.userId,
      table.submittedAt
    ),
  ]
);

export const sourceSyncStates = mysqlTable(
  "source_sync_states",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceId: varchar("sourceId", { length: 64 }).notNull(),
    scopeKey: varchar("scopeKey", { length: 180 }).notNull(),
    status: mysqlEnum("status", [
      "idle",
      "running",
      "succeeded",
      "failed",
      "rate_limited",
    ])
      .default("idle")
      .notNull(),
    cursor: varchar("cursor", { length: 255 }),
    lastError: text("lastError"),
    lastStartedAt: timestamp("lastStartedAt"),
    lastFinishedAt: timestamp("lastFinishedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("source_sync_states_source_scope_unique").on(
      table.sourceId,
      table.scopeKey
    ),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Problem = typeof problems.$inferSelect;
export type SolvingAttempt = typeof solvingAttempts.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
