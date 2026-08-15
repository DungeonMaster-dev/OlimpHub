export function selectDailySurpriseProblemIds(
  problemIds: number[],
  dayKey: string,
  count = 4
): number[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    throw new Error("Daily surprise selection requires a UTC day key.");
  }
  if (!Number.isInteger(count) || count < 1 || count > 8) {
    throw new Error("Daily surprise selection count must be between 1 and 8.");
  }
  const uniqueIds = Array.from(new Set(problemIds));
  const rank = (problemId: number) => {
    let value = 2166136261;
    for (const character of `${dayKey}:${problemId}`) {
      value ^= character.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  };
  return uniqueIds
    .sort((left, right) => rank(left) - rank(right) || left - right)
    .slice(0, count);
}
