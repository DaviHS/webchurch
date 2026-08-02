"use client";

import { PresentationManager } from "@/components/shared/presentation/presentation-manager";

interface SongPresentationProps {
  song: any;
  onClose: () => void;
}

export function SongPresentation({ song, onClose }: SongPresentationProps) {
  return <PresentationManager song={song} onClose={onClose} />;
}