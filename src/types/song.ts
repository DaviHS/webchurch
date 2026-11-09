export interface Song {
  id: number;
  title: string;
  artist: string;
  category?: string;
  lyrics?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  spotifyUrl?: string;
  spotifyTrackId?: string;
  duration?: number;
  /** Música que só guarda a referência: não entra nas playlists. */
  skipPlaylist?: boolean;
  /** Quantas vezes tocou em eventos (até hoje) e a última vez. */
  playCount?: number;
  lastPlayed?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SongWithDetails extends Song {
  lastExecutedAt?: Date;
  executionCount?: number;
  averagePosition?: number;
}