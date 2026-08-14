export type SourceFailureKind = "retryable_failure" | "permanent_failure";

export type SourceResult<T> =
  | { status: "success"; data: T; observedAt: Date }
  | { status: SourceFailureKind; message: string; observedAt: Date };

export type SourceProblem = {
  externalKey: string;
  title: string;
  sourceUrl: string;
  difficulty: number | null;
  tags: string[];
};

export type SourceSubmission = {
  externalSubmissionId: string;
  externalProblemKey: string;
  verdict: string;
  language: string | null;
  submittedAt: Date;
};

export type SourceSubmissionPage = {
  items: SourceSubmission[];
  isExhausted: boolean;
};

export type SourcePublicProfile = {
  externalUserKey: string;
  displayName: string;
};

export type SourceRatingChange = {
  externalContestId: string;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratedAt: Date;
};

export interface ProblemSourceAdapter {
  readonly sourceId: string;
  fetchProblemSnapshot(): Promise<SourceResult<SourceProblem[]>>;
  fetchSubmissionsPage(input: {
    handle: string;
    from: number;
    count: number;
  }): Promise<SourceResult<SourceSubmissionPage>>;
  fetchPublicProfile(input: {
    handle: string;
  }): Promise<SourceResult<SourcePublicProfile>>;
  fetchRatingHistory(input: {
    handle: string;
  }): Promise<SourceResult<SourceRatingChange[]>>;
}
