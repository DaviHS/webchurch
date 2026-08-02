export interface SongSlide {
  id: number;
  title: string;
  artist?: string | null;
  lyrics: string;
}

export interface PresentationState {
  currentSlide: number;
  totalSlides: number;
  slides: string[];
  songTitle: string;
  songArtist?: string | null;
  isBlackScreen: boolean;
  nextSlidePreview: string;
}

export interface PresentationSong {
  id: number;
  title: string;
  artist?: string | null;
  lyrics?: string;
}