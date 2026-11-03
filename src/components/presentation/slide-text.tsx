import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SlideTextProps {
  text: string;
  maxHeight?: number;
  maxFont?: number;
  className?: string;
  style?: CSSProperties;
}

export function SlideText({ text, maxHeight = 86, maxFont = 11, className, style }: SlideTextProps) {
  const lines = text.split("\n");
  const longest = Math.max(1, ...lines.map((line) => line.length));
  const LINE_HEIGHT = 1.25;
  const byHeight = maxHeight / (lines.length * LINE_HEIGHT);
  const byWidth = 92 / (longest * 0.52);

  return (
    <p
      className={cn("whitespace-pre-line text-center font-semibold text-balance", className)}
      style={{
        fontSize: `min(${byHeight.toFixed(2)}cqh, ${byWidth.toFixed(2)}cqw, ${maxFont}cqh)`,
        lineHeight: LINE_HEIGHT,
        ...style,
      }}
    >
      {text}
    </p>
  );
}
