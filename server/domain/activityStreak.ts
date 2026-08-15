function utcDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

function previousUtcDay(value: Date) {
  const previous = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous;
}

export function buildActivityStreak(
  activeDates: string[],
  now: Date
): {
  currentDays: number;
  activeToday: boolean;
  lastActiveDate: string | null;
} {
  const activeDays = new Set(activeDates);
  const today = utcDay(now);
  const activeToday = activeDays.has(today);
  let cursor = activeToday ? new Date(now) : previousUtcDay(now);
  let currentDays = 0;

  while (activeDays.has(utcDay(cursor))) {
    currentDays += 1;
    cursor = previousUtcDay(cursor);
  }

  const lastActiveDate = activeDates.sort().at(-1) ?? null;
  return { currentDays, activeToday, lastActiveDate };
}
