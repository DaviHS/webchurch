export interface EventData {
  id: number;
  title: string;
  type: string;
  date: Date;
  description?: string | null;
  location?: string | null;
  preacher?: string | null;
  bibleVerse?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventWithDetails extends EventData {
  songs: EventSong[];
  participants: EventParticipant[];
}

export interface EventSong {
  id: number;
  eventId: number;
  songId: number;
  order: number;
  leaderId?: number | null;
  notes?: string | null;
  song?: any;
  leader?: any;
}

export interface EventParticipant {
  id: number;
  eventId: number;
  memberId: number;
  role: string;
  instrument?: string | null;
  member?: any;
}