export const dailyCodeforcesProfileSyncCron = "0 0 3 * * *";

export function codeforcesProfileSyncJobName(codeforcesLinkId: number) {
  return `codeforces-daily-profile-${codeforcesLinkId}`;
}
