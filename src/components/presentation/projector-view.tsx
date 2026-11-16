import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PresentationState } from "./protocol";
import { SlideText } from "./slide-text";
import { themeById } from "./themes";
import { ProjectorVideo } from "./projector-video";

interface ProjectorViewProps {
  state: PresentationState | null;
  className?: string;
  preview?: boolean;
  onVideoError?: (videoId: string) => void;
  videoSeek?: { delta: number; nonce: number } | null;
}

function ProjectorMessage({ message }: { message: string }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center bg-black/75 px-[4cqw] py-[2.5cqh] animate-in fade-in duration-300">
      <p className="text-center text-[min(6cqh,4cqw)] font-semibold leading-tight text-balance text-white">{message}</p>
    </div>
  );
}

export function ProjectorView({ state, className, preview = false, onVideoError, videoSeek }: ProjectorViewProps) {
  const mode = state?.mode ?? "logo";
  const text = mode === "live" ? (state?.live?.text ?? null) : null;
  const theme = themeById(state?.theme);
  const video = state?.video ?? null;
  const message = state?.projectorMessage?.trim() ?? "";

  if (video && !video.blocked) {
    return (
      <div className={cn("@container/slide relative h-full w-full overflow-hidden bg-black [container-type:size]", className)}>
        {preview ? (
          <div
            className="flex h-full w-full items-start bg-cover bg-center"
            style={{ backgroundImage: `url(https://i.ytimg.com/vi/${video.id}/hqdefault.jpg)` }}
          >
            <span className="m-2 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
              {video.playing ? "Vídeo tocando no projetor" : "Vídeo pausado"}
            </span>
          </div>
        ) : (
          <ProjectorVideo videoId={video.id} playing={video.playing} seek={videoSeek} onError={onVideoError} />
        )}
        {message && <ProjectorMessage message={message} />}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "@container/slide relative flex h-full w-full items-center justify-center overflow-hidden [container-type:size]",
        mode === "black" && "bg-black",
        message && "pb-[16cqh]",
        className
      )}
      style={mode === "black" ? undefined : { background: theme.background }}
    >
      {mode === "logo" && (
        <Image
          src="/logo.png"
          alt="Igreja Central"
          width={1080}
          height={1080}
          unoptimized
          className={cn("w-auto object-contain drop-shadow-2xl animate-in fade-in duration-500", message ? "h-[45cqh]" : "h-[55cqh]")}
        />
      )}

      {text && (
        <SlideText
          key={text}
          text={text}
          maxHeight={message ? 70 : 86}
          className="px-[4cqw] animate-in fade-in duration-300"
          style={{ color: theme.text, textShadow: theme.shadow }}
        />
      )}

      {message && <ProjectorMessage message={message} />}
    </div>
  );
}
