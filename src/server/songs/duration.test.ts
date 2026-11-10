import { beforeEach, describe, expect, it, vi } from "vitest";

const youtube = vi.hoisted(() => ({ isConfigured: vi.fn(), getVideoDurations: vi.fn() }));
const spotify = vi.hoisted(() => ({ isConfigured: vi.fn(), getTrack: vi.fn() }));

vi.mock("@/lib/youtube", () => ({ youtubeService: youtube }));
vi.mock("@/lib/spotify", () => ({ spotifyService: spotify }));

import { FALLBACK_DURATION_SECONDS, needsDuration, resolveDuration } from "./duration";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  youtube.isConfigured.mockReturnValue(true);
  spotify.isConfigured.mockReturnValue(true);
});

describe("resolveDuration", () => {
  it("usa a duração do vídeo do YouTube primeiro", async () => {
    youtube.getVideoDurations.mockResolvedValue(new Map([["v1", 215]]));
    spotify.getTrack.mockResolvedValue({ durationSeconds: 200 });
    expect(await resolveDuration("v1", "t1", [])).toBe(215);
    expect(spotify.getTrack).not.toHaveBeenCalled();
  });

  it("cai para o Spotify quando o YouTube não informa", async () => {
    youtube.getVideoDurations.mockResolvedValue(new Map());
    spotify.getTrack.mockResolvedValue({ durationSeconds: 200 });
    expect(await resolveDuration("v1", "t1", [])).toBe(200);
  });

  it("cai para o Spotify quando não há vídeo", async () => {
    spotify.getTrack.mockResolvedValue({ durationSeconds: 180 });
    expect(await resolveDuration(null, "t1", [])).toBe(180);
    expect(youtube.getVideoDurations).not.toHaveBeenCalled();
  });

  it("usa 00:01 quando nenhuma fonte responde", async () => {
    expect(await resolveDuration(null, null, [])).toBe(FALLBACK_DURATION_SECONDS);
    expect(FALLBACK_DURATION_SECONDS).toBe(1);
  });

  it("não consulta serviços que não estão configurados", async () => {
    youtube.isConfigured.mockReturnValue(false);
    spotify.isConfigured.mockReturnValue(false);
    expect(await resolveDuration("v1", "t1", [])).toBe(FALLBACK_DURATION_SECONDS);
    expect(youtube.getVideoDurations).not.toHaveBeenCalled();
    expect(spotify.getTrack).not.toHaveBeenCalled();
  });

  it("segue para a próxima fonte e avisa quando o YouTube falha", async () => {
    youtube.getVideoDurations.mockRejectedValue(new Error("cota"));
    spotify.getTrack.mockResolvedValue({ durationSeconds: 150 });
    const warnings: string[] = [];
    expect(await resolveDuration("v1", "t1", warnings)).toBe(150);
    expect(warnings).toHaveLength(1);
  });
});

describe("needsDuration", () => {
  it("considera sem duração: nulo, zero e 00:01", () => {
    expect(needsDuration(null)).toBe(true);
    expect(needsDuration(0)).toBe(true);
    expect(needsDuration(1)).toBe(true);
  });

  it("considera preenchida qualquer duração maior", () => {
    expect(needsDuration(2)).toBe(false);
    expect(needsDuration(215)).toBe(false);
  });
});
