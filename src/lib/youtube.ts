import "server-only";
import { auth, youtube, type youtube_v3 } from "@googleapis/youtube";
import { env } from "@/env";
import { extractYouTubeVideoId, youtubePlaylistUrl } from "@/lib/youtube-url";

export type YouTubeErrorReason = "not_configured" | "auth" | "quota" | "playlist_not_found" | "unknown";

const MESSAGES: Record<YouTubeErrorReason, string> = {
  not_configured: "Integração com o YouTube não configurada.",
  auth: "A conexão com o YouTube expirou. Gere um novo token com `npm run youtube:token`.",
  quota: "A cota diária da API do YouTube acabou. Tente novamente amanhã.",
  playlist_not_found: "A playlist configurada (YOUTUBE_PLAYLIST_ID) não foi encontrada nesta conta.",
  unknown: "Erro inesperado ao falar com o YouTube.",
};

export class YouTubeIntegrationError extends Error {
  constructor(
    readonly reason: YouTubeErrorReason,
    readonly detail?: string
  ) {
    super(MESSAGES[reason]);
    this.name = "YouTubeIntegrationError";
  }
}

interface GoogleErrorShape {
  response?: {
    status?: number;
    data?: {
      error?: string | { code?: number; message?: string; errors?: { reason?: string }[] };
      error_description?: string;
    };
  };
  message?: string;
}

function classify(error: unknown): YouTubeIntegrationError {
  if (error instanceof YouTubeIntegrationError) return error;
  const shape = (typeof error === "object" && error !== null ? error : {}) as GoogleErrorShape;
  const data = shape.response?.data;
  const status = shape.response?.status;

  if (data?.error === "invalid_grant" || data?.error === "invalid_client" || data?.error === "unauthorized_client") {
    return new YouTubeIntegrationError("auth", `${data.error}: ${data.error_description ?? ""}`);
  }

  const apiError = typeof data?.error === "object" ? data.error : undefined;
  const reason = apiError?.errors?.[0]?.reason;
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded" || reason === "rateLimitExceeded") {
    return new YouTubeIntegrationError("quota", reason);
  }
  if (reason === "playlistNotFound") return new YouTubeIntegrationError("playlist_not_found", reason);
  if (status === 401 || reason === "authError" || reason === "insufficientPermissions" || reason === "forbidden") {
    return new YouTubeIntegrationError("auth", reason ?? String(status));
  }
  return new YouTubeIntegrationError("unknown", apiError?.message ?? shape.message);
}

const AUTH_BACKOFF_MS = 10 * 60 * 1000;
const STATUS_TTL_MS = 5 * 60 * 1000;

export interface YouTubeStatus {
  configured: boolean;
  ok: boolean;
  reason?: YouTubeErrorReason;
  message?: string;
  playlist?: { id: string; title: string; itemCount: number; url: string };
  checkedAt: number;
}

export function parseIsoDuration(value: string | null | undefined): number {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value ?? "");
  if (!match) return 0;
  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;
  return Number(days) * 86400 + Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

export interface PlaylistSyncResult {
  added: number;
  alreadyInPlaylist: number;
  remaining: number;
  failed: number;
}

class YouTubeService {
  private client: youtube_v3.Youtube | null = null;
  private authBrokenUntil = 0;
  private lastAuthError: YouTubeIntegrationError | null = null;
  private statusCache: YouTubeStatus | null = null;

  get playlistId(): string | undefined {
    return env.YOUTUBE_PLAYLIST_ID;
  }

  isConfigured(): boolean {
    return Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN);
  }

  private getClient(): youtube_v3.Youtube {
    if (!this.isConfigured()) throw new YouTubeIntegrationError("not_configured");
    if (this.lastAuthError && Date.now() < this.authBrokenUntil) throw this.lastAuthError;

    if (!this.client) {
      const oauth2Client = new auth.OAuth2(env.YOUTUBE_CLIENT_ID, env.YOUTUBE_CLIENT_SECRET);
      oauth2Client.setCredentials({ refresh_token: env.YOUTUBE_REFRESH_TOKEN });
      this.client = youtube({ version: "v3", auth: oauth2Client });
    }
    return this.client;
  }

  private async call<T>(operation: (client: youtube_v3.Youtube) => Promise<T>): Promise<T> {
    const client = this.getClient();
    try {
      const result = await operation(client);
      this.lastAuthError = null;
      return result;
    } catch (error) {
      const classified = classify(error);
      if (classified.reason === "auth") {
        this.lastAuthError = classified;
        this.authBrokenUntil = Date.now() + AUTH_BACKOFF_MS;
        this.client = null;
      }
      this.statusCache = null;
      console.error(`[YouTube] ${classified.message}`, classified.detail ?? "");
      throw classified;
    }
  }

  private requirePlaylist(): string {
    const id = this.playlistId;
    if (!id) throw new YouTubeIntegrationError("not_configured", "YOUTUBE_PLAYLIST_ID ausente");
    return id;
  }

  extractVideoId(url: string): string | null {
    return extractYouTubeVideoId(url);
  }

  async searchVideo(title: string, artist?: string | null): Promise<string | null> {
    const response = await this.call((client) =>
      client.search.list({
        part: ["id"],
        q: artist ? `${title} ${artist}` : title,
        type: ["video"],
        videoEmbeddable: "true",
        maxResults: 1,
      })
    );
    return response.data.items?.[0]?.id?.videoId ?? null;
  }

  async getVideoDurations(videoIds: readonly string[]): Promise<Map<string, number>> {
    const unique = [...new Set(videoIds)];
    const durations = new Map<string, number>();

    for (let i = 0; i < unique.length; i += 50) {
      const chunk = unique.slice(i, i + 50);
      const response = await this.call((client) =>
        client.videos.list({ part: ["contentDetails"], id: chunk, maxResults: 50 })
      );
      for (const video of response.data.items ?? []) {
        const seconds = parseIsoDuration(video.contentDetails?.duration);
        if (video.id && seconds > 0) durations.set(video.id, seconds);
      }
    }
    return durations;
  }

  private async findPlaylistItemId(videoId: string): Promise<string | null> {
    const playlistId = this.requirePlaylist();
    const response = await this.call((client) =>
      client.playlistItems.list({ part: ["id"], playlistId, videoId, maxResults: 1 })
    );
    return response.data.items?.[0]?.id ?? null;
  }

  async addToPlaylist(videoId: string): Promise<"added" | "already"> {
    if (await this.findPlaylistItemId(videoId)) return "already";
    const playlistId = this.requirePlaylist();
    await this.call((client) =>
      client.playlistItems.insert({
        part: ["snippet"],
        requestBody: { snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } } },
      })
    );
    return "added";
  }

  async removeFromPlaylist(videoId: string): Promise<boolean> {
    const itemId = await this.findPlaylistItemId(videoId);
    if (!itemId) return false;
    await this.call((client) => client.playlistItems.delete({ id: itemId }));
    return true;
  }

  private async listPlaylistVideoIds(): Promise<Set<string>> {
    const playlistId = this.requirePlaylist();
    const ids = new Set<string>();
    let pageToken: string | undefined;
    do {
      const response = await this.call((client) =>
        client.playlistItems.list({ part: ["contentDetails"], playlistId, maxResults: 50, pageToken })
      );
      for (const item of response.data.items ?? []) {
        const id = item.contentDetails?.videoId;
        if (id) ids.add(id);
      }
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);
    return ids;
  }

  async syncPlaylist(videoIds: readonly string[], maxInserts = 40): Promise<PlaylistSyncResult> {
    const existing = await this.listPlaylistVideoIds();
    const missing = [...new Set(videoIds)].filter((id) => !existing.has(id));
    const result: PlaylistSyncResult = {
      added: 0,
      alreadyInPlaylist: videoIds.length - missing.length,
      remaining: Math.max(0, missing.length - maxInserts),
      failed: 0,
    };

    const playlistId = this.requirePlaylist();
    for (const videoId of missing.slice(0, maxInserts)) {
      try {
        await this.call((client) =>
          client.playlistItems.insert({
            part: ["snippet"],
            requestBody: { snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } } },
          })
        );
        result.added++;
      } catch (error) {
        if (error instanceof YouTubeIntegrationError && (error.reason === "auth" || error.reason === "quota")) throw error;
        result.failed++;
      }
    }

    this.statusCache = null;
    return result;
  }

  async getStatus({ force = false } = {}): Promise<YouTubeStatus> {
    if (!force && this.statusCache && Date.now() - this.statusCache.checkedAt < STATUS_TTL_MS) {
      return this.statusCache;
    }

    let status: YouTubeStatus;
    if (!this.isConfigured() || !this.playlistId) {
      status = { configured: false, ok: false, reason: "not_configured", message: MESSAGES.not_configured, checkedAt: Date.now() };
    } else {
      try {
        if (force) this.authBrokenUntil = 0;
        const playlistId = this.playlistId;
        const response = await this.call((client) =>
          client.playlists.list({ part: ["snippet", "contentDetails"], id: [playlistId], maxResults: 1 })
        );
        const playlist = response.data.items?.[0];
        status = playlist
          ? {
              configured: true,
              ok: true,
              playlist: {
                id: playlistId,
                title: playlist.snippet?.title ?? "Playlist",
                itemCount: playlist.contentDetails?.itemCount ?? 0,
                url: youtubePlaylistUrl(playlistId),
              },
              checkedAt: Date.now(),
            }
          : { configured: true, ok: false, reason: "playlist_not_found", message: MESSAGES.playlist_not_found, checkedAt: Date.now() };
      } catch (error) {
        const classified = classify(error);
        status = { configured: true, ok: false, reason: classified.reason, message: classified.message, checkedAt: Date.now() };
      }
    }

    this.statusCache = status;
    return status;
  }
}

export const youtubeService = new YouTubeService();
