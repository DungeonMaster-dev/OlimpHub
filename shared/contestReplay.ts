export const contestReplayCalculationVersion = "contest-replay-v1";

type ContestReplayTrace = Array<{
  itemId: number;
  position: number;
  status: string;
  problemId: number;
  problemTitle: string;
  completedElapsedSeconds: number | null;
  completionEvidence: string;
}>;

export function buildContestReplay(input: {
  status: string;
  autopsy: { available: boolean; trace: ContestReplayTrace };
}) {
  if (
    (input.status !== "completed" && input.status !== "expired") ||
    !input.autopsy.available
  )
    return {
      calculationVersion: contestReplayCalculationVersion,
      available: false,
      reason: "contest_not_terminal" as const,
      frames: [],
    };

  return {
    calculationVersion: contestReplayCalculationVersion,
    available: true,
    reason: null,
    frames: input.autopsy.trace.map(frame => ({
      frameIndex: frame.position,
      itemId: frame.itemId,
      problemId: frame.problemId,
      problemTitle: frame.problemTitle,
      status: frame.status,
      completedElapsedSeconds: frame.completedElapsedSeconds,
      completionEvidence: frame.completionEvidence,
    })),
  };
}
