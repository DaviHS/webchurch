import "server-only";
import { auth, youtube, type youtube_v3 } from "@googleapis/youtube";
import { env } from "@/env";
import { getSetting, SETTING_YOUTUBE_PLAYLIST_ID } from "@/server/settings";
import { extractYouTubeVideoId, youtubePlaylistUrl } from "@/lib/youtube-url";

export type YouTubeErrorReason = "not_configured" | "auth" | "quota" | "playlist_not_found" | "unknown";

const MESSAGES: Record<YouTubeErrorReason, string> = {
  not_configured: "Integração com o YouTube não configurada.",
  auth: "A conexão com o YouTube expirou. Gere um novo token com `npm run youtube:token`.",
  quota: "A cota diária da API do YouTube acabou. Tente novamente amanhã.",
  playlist_not_found: "A playlist configurada não foi encontrada nesta conta.",
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

const PLAYLIST_ID_TTL_MS = 60_000;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const words = (value: string) => normalizeText(value).split(" ").filter((word) => word.length > 1);

/** Escolhe o resultado mais parecido com a música; prefere versão oficial/áudio e evita covers e playbacks. */
export function pickBestVideo(items: youtube_v3.Schema$SearchResult[], title: string, artist?: string | null): string | null {
  const titleWords = words(title);
  const artistWords = artist ? words(artist) : [];
  let best: { id: string; score: number } | null = null;

  for (const item of items) {
    const id = item.id?.videoId;
    if (!id) continue;
    const haystack = normalizeText(`${item.snippet?.title ?? ""} ${item.snippet?.channelTitle ?? ""}`);
    const has = (word: string) => haystack.split(" ").includes(word);
    const titleHit = titleWords.length ? titleWords.filter(has).length / titleWords.length : 0;
    // O título precisa aparecer quase todo: evita pegar outra música do mesmo artista.
    if (titleHit < 0.7) continue;
    const artistHit = artistWords.length ? artistWords.filter(has).length / artistWords.length : 0;
    let score = titleHit * 10 + artistHit * 5;
    if (/(oficial|official|clipe|ao vivo|live|audio)/.test(haystack)) score += 1;
    if (/(playback|karaoke|cover|instrumental|letra|lyrics|legendado)/.test(haystack)) score -= 3;
    if (!best || score > best.score) best = { id, score };
  }
  return best?.id ?? null;
}

class YouTubeService {
  private client: youtube_v3.Youtube | null = null;
  private authBrokenUntil = 0;
  private lastAuthError: YouTubeIntegrationError | null = null;
  private statusCache: YouTubeStatus | null = null;

  private playlistIdCache: { value: string | undefined; loadedAt: number } | null = null;

  /** Id da playlist, guardado no banco (tabela app_settings). Fica em memória por 1 minuto. */
  async getPlaylistId(): Promise<string | undefined> {
    if (!this.playlistIdCache || Date.now() - this.playlistIdCache.loadedAt > PLAYLIST_ID_TTL_MS) {
      this.playlistIdCache = { value: (await getSetting(SETTING_YOUTUBE_PLAYLIST_ID)) ?? undefined, loadedAt: Date.now() };
    }
    return this.playlistIdCache.value;
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

  private async requirePlaylist(): Promise<string> {
    const id = await this.getPlaylistId();
    if (!id) throw new YouTubeIntegrationError("not_configured", "Playlist do YouTube não definida");
    return id;
  }

  extractVideoId(url: string): string | null {
    return extractYouTubeVideoId(url);
  }

  /**
   * Procura o vídeo da música. Olha vários resultados (não só o primeiro) e fica com o que mais
   * combina com título e artista; sem achar com os dois, tenta de novo só com o título.
   */
  async searchVideo(title: string, artist?: string | null): Promise<string | null> {
    const queries = artist ? [`${title} ${artist}`, title] : [title];
    for (const q of queries) {
      const response = await this.call((client) =>
        client.search.list({ part: ["snippet"], q, type: ["video"], videoCategoryId: "10", maxResults: 8 })
      );
      const best = pickBestVideo(response.data.items ?? [], title, artist);
      if (best) return best;
    }
    return null;
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
    const playlistId = await this.requirePlaylist();
    const response = await this.call((client) =>
      client.playlistItems.list({ part: ["id"], playlistId, videoId, maxResults: 1 })
    );
    return response.data.items?.[0]?.id ?? null;
  }

  async addToPlaylist(videoId: string): Promise<"added" | "already"> {
    if (await this.findPlaylistItemId(videoId)) return "already";
    const playlistId = await this.requirePlaylist();
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
    const playlistId = await this.requirePlaylist();
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

    const playlistId = await this.requirePlaylist();
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
    const configuredPlaylistId = await this.getPlaylistId();
    if (!this.isConfigured() || !configuredPlaylistId) {
      status = { configured: false, ok: false, reason: "not_configured", message: MESSAGES.not_configured, checkedAt: Date.now() };
    } else {
      try {
        if (force) this.authBrokenUntil = 0;
        const playlistId = configuredPlaylistId;
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
