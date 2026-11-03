import { cn } from "@/lib/utils";

const VARIANTS = {
  solid: "bg-primary text-primary-foreground",
  soft: "bg-primary/10 text-primary",
  success: "bg-success text-success-foreground",
} as const;

interface RankBadgeProps {
  rank: number;
  variant?: keyof typeof VARIANTS;
  className?: string;
}

export function RankBadge({ rank, variant = "solid", className }: RankBadgeProps) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:size-8 sm:text-sm",
        VARIANTS[variant],
        className
      )}
    >
      {rank}
    </span>
  );
}
