import { z } from "zod";

const SPOTIFY_API = "https://api.spotify.com/v1";

type SpotifyIdType = "track" | "artist" | "playlist" | "album";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  album: { name: string; images: { url: string }[] };
}

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

const errorResponseSchema = z
  .object({
    error: z.union([z.string(), z.object({ message: z.string().optional() })]).optional(),
    error_description: z.string().optional(),
  })
  .catch({});

interface SearchResponse {
  tracks?: { items?: SpotifyTrack[] };
}

interface PlaylistTracksPage {
  items: { track: { id: string | null } | null }[];
  next: string | null;
}

const ID_PATTERNS: { type: SpotifyIdType; pattern: RegExp }[] = (
  ["track", "artist", "playlist", "album"] as const
).flatMap((type) => [
  { type, pattern: new RegExp(`spotify\\.com/(?:intl-[a-z]+/)?${type}/([a-zA-Z0-9]{22})`) },
  { type, pattern: new RegExp(`spotify:${type}:([a-zA-Z0-9]{22})`) },
]);

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID ?? ""}:${process.env.SPOTIFY_CLIENT_SECRET ?? ""}`
    ).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.SPOTIFY_REFRESH_TOKEN ?? "",
      }),
    });

    const body: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = errorResponseSchema.parse(body);
      const message = typeof error.error === "string" ? error.error : error.error?.message;
      throw new Error(`Spotify API Error: ${message ?? response.status} - ${error.error_description ?? ""}`);
    }

    const token = tokenResponseSchema.parse(body);
    this.accessToken = token.access_token;
    this.tokenExpiry = Date.now() + (token.expires_in - 60) * 1000;
    return token.access_token;
  }

  private async request<T>(pathOrUrl: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${SPOTIFY_API}${pathOrUrl}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = errorResponseSchema.parse(await response.json().catch(() => ({})));
      const message = typeof error.error === "string" ? error.error : error.error?.message;
      throw new Error(`Spotify API Error: ${response.status} - ${message ?? response.statusText}`);
    }

    return (await response.json()) as T;
  }

  private resolvePlaylist(playlistId?: string): string {
    const id = playlistId ?? process.env.SPOTIFY_PLAYLIST_ID;
    if (!id) throw new Error("SPOTIFY_PLAYLIST_ID não configurado");
    return id;
  }

  extractId(url: string): { type: SpotifyIdType; id: string } | null {
    for (const { type, pattern } of ID_PATTERNS) {
      const id = pattern.exec(url)?.[1];
      if (id) return { type, id };
    }
    return null;
  }

  async searchTrack(title: string, artist?: string | null): Promise<SpotifyTrack | null> {
    try {
      const query = artist ? `${title} artist:${artist}` : title;
      const data = await this.request<SearchResponse>(
        `/search?q=${encodeURIComponent(query)}&type=track&limit=1`
      );
      return data.tracks?.items?.[0] ?? null;
    } catch (error) {
      console.error("Erro na busca do Spotify:", error);
      return null;
    }
  }

  async isTrackInPlaylist(trackId: string, playlistId?: string): Promise<boolean> {
    try {
      let next: string | null = `/playlists/${this.resolvePlaylist(playlistId)}/tracks?fields=items(track(id)),next&limit=100`;
      while (next) {
        const page: PlaylistTracksPage = await this.request<PlaylistTracksPage>(next);
        if (page.items.some((item) => item.track?.id === trackId)) return true;
        next = page.next;
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar playlist do Spotify:", error);
      return false;
    }
  }

  async addToPlaylist(trackId: string, playlistId?: string): Promise<boolean> {
    try {
      const target = this.resolvePlaylist(playlistId);
      if (await this.isTrackInPlaylist(trackId, target)) return true;

      await this.request(`/playlists/${target}/tracks`, {
        method: "POST",
        body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
      });
      return true;
    } catch (error) {
      console.error("Erro ao adicionar à playlist do Spotify:", error);
      return false;
    }
  }

  async removeFromPlaylist(trackId: string, playlistId?: string): Promise<boolean> {
    try {
      const target = this.resolvePlaylist(playlistId);
      if (!(await this.isTrackInPlaylist(trackId, target))) return true;

      await this.request(`/playlists/${target}/tracks`, {
        method: "DELETE",
        body: JSON.stringify({ tracks: [{ uri: `spotify:track:${trackId}` }] }),
      });
      return true;
    } catch (error) {
      console.error("Erro ao remover música da playlist do Spotify:", error);
      return false;
    }
  }

  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    try {
      return await this.request<SpotifyTrack>(`/tracks/${trackId}`);
    } catch (error) {
      console.error("Erro ao obter dados da faixa no Spotify:", error);
      return null;
    }
  }
}

export const spotifyService = new SpotifyService();
