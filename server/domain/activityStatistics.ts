export type ActivityStatisticsEvent = {
  occurredAt: Date;
  eventType: string;
  metadata: Record<string, unknown>;
};

type ActivityStatisticsPeriod = {
  startsAt: Date;
  endsAt: Date;
  eventCount: number;
  activeMinutes: number;
  solvedUpdates: number;
};

function startOfUtcDay(now: Date) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function startOfUtcWeek(now: Date) {
  const start = startOfUtcDay(now);
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

function startOfUtcMonth(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function summarizePeriod(
  events: ActivityStatisticsEvent[],
  startsAt: Date,
  endsAt: Date
): ActivityStatisticsPeriod {
  const eventsInPeriod = events.filter(
    event => event.occurredAt >= startsAt && event.occurredAt <= endsAt
  );
  return {
    startsAt,
    endsAt,
    eventCount: eventsInPeriod.length,
    activeMinutes: eventsInPeriod.filter(
      event => event.eventType === "note_editor_active"
    ).length,
    solvedUpdates: eventsInPeriod.filter(
      event =>
        event.eventType === "problem_status_changed" &&
        event.metadata.status === "solved"
    ).length,
  };
}

export function buildActivityStatistics(
  events: ActivityStatisticsEvent[],
  now: Date
) {
  const endsAt = now;
  return {
    day: summarizePeriod(events, startOfUtcDay(now), endsAt),
    week: summarizePeriod(events, startOfUtcWeek(now), endsAt),
    month: summarizePeriod(events, startOfUtcMonth(now), endsAt),
  };
}

export function earliestActivityStatisticsStart(now: Date) {
  return [startOfUtcDay(now), startOfUtcWeek(now), startOfUtcMonth(now)].reduce(
    (earliest, candidate) => (candidate < earliest ? candidate : earliest)
  );
}
