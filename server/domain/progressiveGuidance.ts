export const progressiveGuidanceCalculationVersion = "progressive-guidance-v1";

const solutionLikeHint = (content: string) =>
  /```|(?:^|\n)\s*(?:function|class|const|let|var)\b|\b(?:full|complete)\s+solution\b|\banswer\s+is\b/i.test(
    content
  );

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
    .sort((left, right) => left.level - right.level);
  const withheldLevels = revealedHints
    .filter(hint => solutionLikeHint(hint.content))
    .map(hint => hint.level);
  const guidance = revealedHints
    .filter(hint => !solutionLikeHint(hint.content))
    .map(hint => ({ level: hint.level, content: hint.content }));
  return {
    calculationVersion: progressiveGuidanceCalculationVersion,
    status: guidance.length
      ? ("available" as const)
      : withheldLevels.length
        ? ("blocked_for_learning_mode" as const)
        : ("request_first_hint" as const),
    highestRevealedLevel: input.highestRevealedLevel,
    guidance,
    withheldLevels,
    limitations: [
      "Only previously server-revealed approved hints are included.",
      "Solution-like or code-like revealed hints are withheld from learning-mode guidance.",
      "This guidance does not generate or disclose unrevealed hints, notes, source code or raw activity metadata.",
    ],
  };
}
