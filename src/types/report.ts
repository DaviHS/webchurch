import type { RouterOutputs } from "./api";

export type ReportItem = RouterOutputs["report"]["getSongRanking"][number];

export type SongExecution = RouterOutputs["report"]["getSongExecutions"][number];

export type SongStats = NonNullable<RouterOutputs["report"]["getSongStats"]>;

export interface ReportStats {
  totalSongs: number;
  totalExecutions: number;
  average: number;
  maxExecutions: number;
}
