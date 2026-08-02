export interface ReportItem {
  songId: number;
  title: string;
  artist: string | null;
  count: number | string;
}

export interface SongExecution {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: Date;
  eventType: string;
  order: number;
  notes: string | null;
  songId: number;
  songTitle: string;
  songArtist: string | null;
}

export interface SongStats {
  totalExecutions: number;
  firstExecution: Date | null;
  lastExecution: Date | null;
  averageOrder: number | null;
}

export interface ReportStats {
  totalMusicas: number;
  totalExecucoes: number;
  media: number;
  maxExecucoes: number;
}