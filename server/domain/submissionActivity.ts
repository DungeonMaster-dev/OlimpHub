export function summarizeSubmissionVerdicts(
  submissions: Array<{ verdict: string }>
) {
  return Object.fromEntries(
    Object.entries(
      submissions.reduce<Record<string, number>>((counts, submission) => {
        counts[submission.verdict] = (counts[submission.verdict] ?? 0) + 1;
        return counts;
      }, {})
    ).sort(([left], [right]) => left.localeCompare(right))
  );
}
