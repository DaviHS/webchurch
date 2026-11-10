import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { parseTitleSlide, splitReference } from "./deck";

interface SlideTextProps {
  text: string;
  maxHeight?: number;
  maxFont?: number;
  className?: string;
  style?: CSSProperties;
}

export function SlideText({ text, maxHeight = 86, maxFont = 11, className, style }: SlideTextProps) {
  const opening = parseTitleSlide(text);
  if (opening) {
    const titleFont = Math.min(maxFont * 0.8, 92 / (Math.max(1, opening.title.length) * 0.52));
    return (
      <div className={cn("flex flex-col items-center justify-center text-center", className)} style={style}>
        <p className="text-balance font-bold leading-tight" style={{ fontSize: `${titleFont.toFixed(2)}cqmin` }}>
          {opening.title}
        </p>
        {opening.artist && (
          <p className="mt-[1.5cqh] text-balance font-medium opacity-80" style={{ fontSize: `${(titleFont * 0.5).toFixed(2)}cqmin` }}>
            {opening.artist}
          </p>
        )}
      </div>
    );
  }

  const { body, reference } = splitReference(text);
  const lines = body.split("\n");
  const longest = Math.max(1, ...lines.map((line) => line.length));
  const LINE_HEIGHT = 1.25;
  const byHeight = (reference ? maxHeight * 0.82 : maxHeight) / (lines.length * LINE_HEIGHT);
  const byWidth = 92 / (longest * 0.52);

  const paragraph = (
    <p
      className={cn("whitespace-pre-line text-center font-semibold text-balance", !reference && className)}
      style={{
        fontSize: `min(${byHeight.toFixed(2)}cqh, ${byWidth.toFixed(2)}cqw, ${maxFont}cqh)`,
        lineHeight: LINE_HEIGHT,
        ...(reference ? undefined : style),
      }}
    >
      {body}
    </p>
  );
  if (!reference) return paragraph;

  return (
    <div className={cn("flex flex-col items-center", className)} style={style}>
      {paragraph}
      <p className="mt-[2cqh] text-center font-medium opacity-75" style={{ fontSize: `min(${(maxFont * 0.45).toFixed(2)}cqh, 4cqw)` }}>
        {reference}
      </p>
    </div>
  );
}
