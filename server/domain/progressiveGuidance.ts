export const progressiveGuidanceCalculationVersion = "progressive-guidance-v1";

export function buildProgressiveGuidance(input: {
  highestRevealedLevel: number;
  hints: Array<{ level: number; content: string }>;
}) {
  if (
    !Number.isInteger(input.highestRevealedLevel) ||
    input.highestRevealedLevel < -1
  ) {
    throw new Error("Invalid persisted hint level.");
  }
  const revealedHints = input.hints
    .filter(hint => hint.level >= 0 && hint.level <= input.highestRevealedLevel)
    .sort((left, right) => left.level - right.level)
    .map(hint => ({ level: hint.level, content: hint.content }));
  return {
    calculationVersion: progressiveGuidanceCalculationVersion,
    status: revealedHints.length
      ? ("available" as const)
      : ("request_first_hint" as const),
    highestRevealedLevel: input.highestRevealedLevel,
    guidance: revealedHints,
    limitations: [
      "Only previously server-revealed approved hints are included.",
      "This guidance does not generate or disclose a full solution, unrevealed hints, notes, source code or raw activity metadata.",
    ],
  };
}
