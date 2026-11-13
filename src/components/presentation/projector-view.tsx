import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PresentationState } from "./protocol";
import { SlideText } from "./slide-text";
import { themeById } from "./themes";

interface ProjectorViewProps {
  state: PresentationState | null;
  className?: string;
}

export function ProjectorView({ state, className }: ProjectorViewProps) {
  const mode = state?.mode ?? "logo";
  const text = mode === "live" ? (state?.live?.text ?? null) : null;
  const theme = themeById(state?.theme);

  return (
    <div
      className={cn(
        "@container/slide relative flex h-full w-full items-center justify-center overflow-hidden [container-type:size]",
        mode === "black" && "bg-black",
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
          className="h-[55cqh] w-auto object-contain drop-shadow-2xl animate-in fade-in duration-500"
        />
      )}

      {text && (
        <SlideText
          key={text}
          text={text}
          className="px-[4cqw] animate-in fade-in duration-300"
          style={{ color: theme.text, textShadow: theme.shadow }}
        />
      )}
    </div>
  );
}
