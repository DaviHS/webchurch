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
  skipPlaylist?: boolean;
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