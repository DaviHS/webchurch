import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { songs } from "@/server/db/schema";
import { spotifyService, SpotifyIntegrationError } from "@/lib/spotify";
import { youtubeService, YouTubeIntegrationError } from "@/lib/youtube";
import { youtubeWatchUrl } from "@/lib/youtube-url";
import { getSetting, SETTING_SPOTIFY_PLAYLIST_ID } from "@/server/settings";
import { integrationWarning, normalizeLink } from "./common";

export interface YouTubeFields {
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
}

export interface SpotifyFields {
  spotifyUrl: string | null;
  spotifyTrackId: string | null;
}

const NO_YOUTUBE: YouTubeFields = { youtubeUrl: null, youtubeVideoId: null };
const NO_SPOTIFY: SpotifyFields = { spotifyUrl: null, spotifyTrackId: null };

export const getSpotifyPlaylistId = () => getSetting(SETTING_SPOTIFY_PLAYLIST_ID);

export async function resolveYouTube(
  url: string | null | undefined,
  title: string,
  artist: string | null | undefined,
  warnings: string[],
): Promise<YouTubeFields> {
  const link = normalizeLink(url);
  if (link) {
    const youtubeVideoId = youtubeService.extractVideoId(link);
    if (!youtubeVideoId) warnings.push("O link informado não é um vídeo do YouTube reconhecido.");
    return { youtubeUrl: link, youtubeVideoId };
  }
  if (!youtubeService.isConfigured()) return NO_YOUTUBE;

  try {
    const videoId = await youtubeService.searchVideo(title, artist);
    return videoId ? { youtubeUrl: youtubeWatchUrl(videoId), youtubeVideoId: videoId } : NO_YOUTUBE;
  } catch (error) {
    warnings.push(integrationWarning("não foi possível buscar o vídeo no YouTube", error));
    return NO_YOUTUBE;
  }
}

export async function resolveSpotify(
  url: string | null | undefined,
  title: string,
  artist: string | null | undefined,
  warnings: string[],
): Promise<SpotifyFields> {
  const link = normalizeLink(url);
  if (link) {
    const data = spotifyService.extractId(link);
    if (data?.type !== "track") warnings.push("O link informado não é uma faixa do Spotify reconhecida.");
    return { spotifyUrl: link, spotifyTrackId: data?.type === "track" ? data.id : null };
  }
  if (!spotifyService.isConfigured()) return NO_SPOTIFY;
  try {
    const track = await spotifyService.searchTrack(title, artist);
    return track ? { spotifyUrl: track.external_urls.spotify, spotifyTrackId: track.id } : NO_SPOTIFY;
  } catch (error) {
    warnings.push(integrationWarning("não foi possível buscar a faixa no Spotify", error));
    return NO_SPOTIFY;
  }
}

async function isUsedElsewhere(column: typeof songs.youtubeVideoId | typeof songs.spotifyTrackId, value: string, exceptSongId?: number) {
  const [row] = await db
    .select({ count: count() })
    .from(songs)
    .where(and(eq(column, value), eq(songs.skipPlaylist, false), exceptSongId ? ne(songs.id, exceptSongId) : undefined));
  return (row?.count ?? 0) > 0;
}

export async function syncPlaylistVideo(oldId: string | null, newId: string | null, songId: number | undefined, warnings: string[]): Promise<void> {
  if (!youtubeService.isConfigured() || oldId === newId || !(await youtubeService.getPlaylistId())) return;
  try {
    if (oldId && !(await isUsedElsewhere(songs.youtubeVideoId, oldId, songId))) await youtubeService.removeFromPlaylist(oldId);
    if (newId) await youtubeService.addToPlaylist(newId);
  } catch (error) {
    if (error instanceof YouTubeIntegrationError && error.reason === "not_configured") return;
    warnings.push(integrationWarning("a playlist do YouTube não foi atualizada", error));
  }
}

export async function syncSpotifyTrack(oldId: string | null, newId: string | null, songId: number | undefined, warnings: string[]): Promise<void> {
  if (oldId === newId || !spotifyService.isConfigured()) return;
  const playlistId = await getSpotifyPlaylistId();
  if (!playlistId) return;
  try {
    if (oldId && !(await isUsedElsewhere(songs.spotifyTrackId, oldId, songId))) await spotifyService.removeTrack(playlistId, oldId);
    if (newId) await spotifyService.addTracks(playlistId, [newId]);
  } catch (error) {
    if (error instanceof SpotifyIntegrationError && error.reason === "not_configured") return;
    warnings.push(integrationWarning("a playlist do Spotify não foi atualizada", error));
  }
}

interface SongPlaylistState {
  videoId: string | null;
  trackId: string | null;
  skipPlaylist: boolean;
}

/** Ajusta as duas playlists quando a música muda de vídeo ou faixa, ou entra e sai das playlists. */
export async function syncSongPlaylists(
  songId: number,
  before: SongPlaylistState,
  after: SongPlaylistState,
  warnings: string[],
): Promise<void> {
  const inPlaylist = (state: SongPlaylistState, id: string | null) => (state.skipPlaylist ? null : id);
  await Promise.all([
    syncPlaylistVideo(inPlaylist(before, before.videoId), inPlaylist(after, after.videoId), songId, warnings),
    syncSpotifyTrack(inPlaylist(before, before.trackId), inPlaylist(after, after.trackId), songId, warnings),
  ]);
}
