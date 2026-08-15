type TimelineEvent = {
  occurredAt: Date;
  eventType: string;
  metadata: Record<string, unknown>;
};

function utcDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function buildDailyProgressTimeline(input: {
  startsAt: Date;
  endsAt: Date;
  events: TimelineEvent[];
}) {
  const byDay = new Map<
    string,
    { activityCount: number; solvedUpdates: number }
  >();
  for (
    let cursor = new Date(
      Date.UTC(
        input.startsAt.getUTCFullYear(),
        input.startsAt.getUTCMonth(),
        input.startsAt.getUTCDate()
      )
    );
    cursor <= input.endsAt;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    byDay.set(utcDay(cursor), { activityCount: 0, solvedUpdates: 0 });
  }
  for (const event of input.events) {
    const bucket = byDay.get(utcDay(event.occurredAt));
    if (!bucket) continue;
    bucket.activityCount += 1;
    if (
      event.eventType === "problem_status_changed" &&
      event.metadata.status === "solved"
    ) {
      bucket.solvedUpdates += 1;
    }
  }
  return Array.from(byDay, ([date, values]) => ({ date, ...values }));
}
