import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PresentationState } from "./protocol";
import { SlideText } from "./slide-text";

interface ProjectorViewProps {
  state: PresentationState | null;
  className?: string;
}

export function ProjectorView({ state, className }: ProjectorViewProps) {
  const mode = state?.mode ?? "logo";
  const text = mode === "live" ? (state?.live?.text ?? null) : null;

  return (
    <div
      className={cn(
        "@container/slide relative flex h-full w-full items-center justify-center overflow-hidden [container-type:size]",
        mode === "black" ? "bg-black" : "bg-[radial-gradient(ellipse_at_center,#0a5a42_0%,#003F2D_55%,#00261b_100%)]",
        className
      )}
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
          className="px-[4cqw] text-white [text-shadow:0_0.06em_0.18em_rgb(0_0_0/0.55)] animate-in fade-in duration-300"
        />
      )}
    </div>
  );
}
