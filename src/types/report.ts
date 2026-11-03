import type { RouterOutputs } from "./api";

export type ReportItem = RouterOutputs["event"]["getSongsReport"][number];

export type SongExecution = RouterOutputs["event"]["getSongExecutions"][number];

export type SongStats = NonNullable<RouterOutputs["event"]["getSongStats"]>;

export interface ReportStats {
  totalMusicas: number;
  totalExecucoes: number;
  media: number;
  maxExecucoes: number;
}
