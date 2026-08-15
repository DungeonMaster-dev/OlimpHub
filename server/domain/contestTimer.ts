export const defaultContestDurationMinutes = 120;
export const minimumContestDurationMinutes = 15;
export const maximumContestDurationMinutes = 480;

export function contestExpiresAt(startedAt: Date, durationMinutes: number) {
  return new Date(startedAt.getTime() + durationMinutes * 60_000);
}

export function hasContestExpired(expiresAt: Date | null, now = new Date()) {
  return expiresAt !== null && now.getTime() >= expiresAt.getTime();
}

export function remainingContestSeconds(
  expiresAt: Date | null,
  now = new Date()
) {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1_000));
}
