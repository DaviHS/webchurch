const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PATH_PREFIXES = ["embed", "shorts", "live", "v", "e"];

export function extractYouTubeVideoId(input: string | null | undefined): string | null {
  const value = input?.trim();
  if (!value) return null;
  if (VIDEO_ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, "");
  const segments = url.pathname.split("/").filter(Boolean);
  let candidate: string | null | undefined = null;

  if (host === "youtu.be") {
    candidate = segments[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    candidate = url.searchParams.get("v");
    if (!candidate && segments[0] && PATH_PREFIXES.includes(segments[0])) candidate = segments[1];
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
}

export const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

export const youtubeEmbedUrl = (videoId: string, { autoplay = false } = {}) =>
  `https://www.youtube-nocookie.com/embed/${videoId}?rel=0${autoplay ? "&autoplay=1" : ""}`;

export const youtubePlaylistUrl = (playlistId: string) => `https://www.youtube.com/playlist?list=${playlistId}`;
