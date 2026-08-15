export const analyticsRetentionDayOptions = [30, 90, 365] as const;

export type AnalyticsRetentionDays =
  (typeof analyticsRetentionDayOptions)[number];

export function activityRetentionCutoff(retentionDays: number, now: Date) {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

export function laterDate(first: Date, second: Date) {
  return first > second ? first : second;
}
