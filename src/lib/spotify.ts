import { z } from "zod";

const SPOTIFY_API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
/** O Spotify aceita até 100 faixas por chamada de escrita. */
const WRITE_BATCH = 100;

type SpotifyIdType = "track" | "artist" | "playlist" | "album";

export type SpotifyFailure = "not_configured" | "auth" | "api";

export class SpotifyIntegrationError extends Error {
  readonly reason: SpotifyFailure;

  constructor(reason: SpotifyFailure, message: string) {
    super(message);
    this.name = "SpotifyIntegrationError";
    this.reason = reason;
  }
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  external_urls: { spotify: string };
}

export interface SpotifyPlaylistInfo {
  name: string;
  url: string;
  total: number;
}

export interface SpotifyStatus {
  /** Credenciais do aplicativo e playlist definidos. */
  configured: boolean;
  /** Dá para escrever na playlist (o token do dono está válido). */
  ok: boolean;
  reason?: SpotifyFailure;
  message?: string;
  playlist?: SpotifyPlaylistInfo;
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

interface PlaylistPage {
  items: { track?: { id: string | null } | null; item?: { id: string | null } | null }[];
  next: string | null;
}

interface PlaylistResponse {
  name: string;
  external_urls: { spotify: string };
  tracks?: { total: number };
  items?: { total: number };
}

const ID_PATTERNS: { type: SpotifyIdType; pattern: RegExp }[] = (
  ["track", "artist", "playlist", "album"] as const
).flatMap((type) => [
  { type, pattern: new RegExp(`spotify\\.com/(?:intl-[a-z]+/)?${type}/([a-zA-Z0-9]{22})`) },
  { type, pattern: new RegExp(`spotify:${type}:([a-zA-Z0-9]{22})`) },
]);

interface CachedToken {
  value: string;
  expiresAt: number;
}

function messageOf(body: unknown, fallback: string): string {
  const error = errorResponseSchema.parse(body);
  const message = typeof error.error === "string" ? error.error : error.error?.message;
  return [message, error.error_description].filter(Boolean).join(" - ") || fallback;
}

class SpotifyService {
  private appToken: CachedToken | null = null;
  private userToken: CachedToken | null = null;

  /** Dá para buscar e ler (as credenciais do aplicativo bastam). */
  isConfigured(): boolean {
    return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
  }

  /** Dá para alterar a playlist (precisa do token do dono). */
  canWrite(): boolean {
    return this.isConfigured() && Boolean(process.env.SPOTIFY_REFRESH_TOKEN);
  }

  private async fetchToken(params: Record<string, string>): Promise<CachedToken> {
    if (!this.isConfigured()) {
      throw new SpotifyIntegrationError("not_configured", "SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET não configurados");
    }
    const credentials = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
      body: new URLSearchParams(params),
    });
    const body: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reason: SpotifyFailure = response.status === 400 || response.status === 401 ? "auth" : "api";
      throw new SpotifyIntegrationError(reason, `Spotify: ${messageOf(body, String(response.status))}`);
    }
    const token = tokenResponseSchema.parse(body);
    return { value: token.access_token, expiresAt: Date.now() + (token.expires_in - 60) * 1000 };
  }

  /** Token do aplicativo: serve para buscar faixas e ler playlists públicas. */
  private async getAppToken(): Promise<string> {
    if (!this.appToken || Date.now() >= this.appToken.expiresAt) {
      this.appToken = await this.fetchToken({ grant_type: "client_credentials" });
    }
    return this.appToken.value;
  }

  /** Token do dono da playlist: necessário para adicionar e remover faixas. */
  private async getUserToken(): Promise<string> {
    const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
    if (!refresh) throw new SpotifyIntegrationError("not_configured", "SPOTIFY_REFRESH_TOKEN não configurado");
    if (!this.userToken || Date.now() >= this.userToken.expiresAt) {
      this.userToken = await this.fetchToken({ grant_type: "refresh_token", refresh_token: refresh });
    }
    return this.userToken.value;
  }

  private async request<T>(pathOrUrl: string, token: string, options: RequestInit = {}): Promise<T> {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${SPOTIFY_API}${pathOrUrl}`;
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
    });
    if (!response.ok) {
      const message = messageOf(await response.json().catch(() => ({})), response.statusText);
      throw new SpotifyIntegrationError(
        response.status === 401 || response.status === 403 ? "auth" : "api",
        `Spotify (${response.status}): ${message}`
      );
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  extractId(url: string): { type: SpotifyIdType; id: string } | null {
    for (const { type, pattern } of ID_PATTERNS) {
      const id = pattern.exec(url)?.[1];
      if (id) return { type, id };
    }
    return null;
  }

  async searchTrack(title: string, artist?: string | null): Promise<SpotifyTrack | null> {
    const query = artist ? `${title} artist:${artist}` : title;
    const data = await this.request<SearchResponse>(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      await this.getAppToken()
    );
    return data.tracks?.items?.[0] ?? null;
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylistInfo> {
    const data = await this.request<PlaylistResponse>(`/playlists/${playlistId}`, await this.getAppToken());
    return {
      name: data.name,
      url: data.external_urls.spotify,
      total: data.tracks?.total ?? data.items?.total ?? 0,
    };
  }

  async listPlaylistTrackIds(playlistId: string): Promise<Set<string>> {
    const token = await this.getAppToken();
    const ids = new Set<string>();
    let next: string | null = `/playlists/${playlistId}/tracks?limit=100`;
    while (next) {
      const page: PlaylistPage = await this.request<PlaylistPage>(next, token);
      for (const entry of page.items) {
        const id = (entry.track ?? entry.item)?.id;
        if (id) ids.add(id);
      }
      next = page.next;
    }
    return ids;
  }

  /** Adiciona as faixas que ainda não estão na playlist. Devolve quantas entraram. */
  async addTracks(playlistId: string, trackIds: string[]): Promise<number> {
    if (trackIds.length === 0) return 0;
    const present = await this.listPlaylistTrackIds(playlistId);
    const missing = [...new Set(trackIds)].filter((id) => !present.has(id));
    const token = await this.getUserToken();
    for (let i = 0; i < missing.length; i += WRITE_BATCH) {
      await this.request(`/playlists/${playlistId}/tracks`, token, {
        method: "POST",
        body: JSON.stringify({ uris: missing.slice(i, i + WRITE_BATCH).map((id) => `spotify:track:${id}`) }),
      });
    }
    return missing.length;
  }

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    const present = await this.listPlaylistTrackIds(playlistId);
    if (!present.has(trackId)) return;
    await this.request(`/playlists/${playlistId}/tracks`, await this.getUserToken(), {
      method: "DELETE",
      body: JSON.stringify({ tracks: [{ uri: `spotify:track:${trackId}` }] }),
    });
  }

  async getStatus(playlistId: string | null): Promise<SpotifyStatus> {
    if (!this.isConfigured() || !playlistId) return { configured: false, ok: false };

    let playlist: SpotifyPlaylistInfo | undefined;
    try {
      playlist = await this.getPlaylist(playlistId);
    } catch (error) {
      return {
        configured: true,
        ok: false,
        reason: error instanceof SpotifyIntegrationError ? error.reason : "api",
        message: error instanceof Error ? error.message : "Não foi possível ler a playlist.",
      };
    }

    try {
      this.userToken = null;
      await this.getUserToken();
      return { configured: true, ok: true, playlist };
    } catch (error) {
      return {
        configured: true,
        ok: false,
        playlist,
        reason: error instanceof SpotifyIntegrationError ? error.reason : "api",
        message:
          error instanceof SpotifyIntegrationError && error.reason === "not_configured"
            ? "O acesso do dono da playlist ainda não foi autorizado."
            : "O acesso do dono da playlist expirou ou foi revogado. As músicas não entram mais na playlist.",
      };
    }
  }
}

export const spotifyService = new SpotifyService();
