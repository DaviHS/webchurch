import { spotifyService } from "@/lib/spotify";
import { youtubeService } from "@/lib/youtube";
import { integrationWarning } from "./common";

export const FALLBACK_DURATION_SECONDS = 1;

async function durationFromVideo(videoId: string | null, warnings: string[]): Promise<number | undefined> {
  if (!videoId || !youtubeService.isConfigured()) return undefined;
  try {
    return (await youtubeService.getVideoDurations([videoId])).get(videoId);
  } catch (error) {
    warnings.push(integrationWarning("não foi possível obter a duração do vídeo", error));
    return undefined;
  }
}

async function durationFromSpotify(trackId: string | null, warnings: string[]): Promise<number | undefined> {
  if (!trackId || !spotifyService.isConfigured()) return undefined;
  try {
    return (await spotifyService.getTrack(trackId)).durationSeconds;
  } catch (error) {
    warnings.push(integrationWarning("não foi possível obter a duração da faixa do Spotify", error));
    return undefined;
  }
}

/** Duração do vídeo do YouTube; senão a da faixa do Spotify; senão FALLBACK_DURATION_SECONDS. */
export async function resolveDuration(videoId: string | null, trackId: string | null, warnings: string[]): Promise<number> {
  return (await durationFromVideo(videoId, warnings)) ?? (await durationFromSpotify(trackId, warnings)) ?? FALLBACK_DURATION_SECONDS;
}

export const needsDuration = (duration: number | null) => !duration || duration <= FALLBACK_DURATION_SECONDS;
