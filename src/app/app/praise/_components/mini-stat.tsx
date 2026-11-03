import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MiniStatProps {
  value: ReactNode;
  label: string;
  className?: string;
  valueClassName?: string;
}

export function MiniStat({ value, label, className, valueClassName }: MiniStatProps) {
  return (
    <div className={cn("min-w-0 rounded-lg bg-muted/40 p-2 text-center sm:p-3", className)}>
      <div className={cn("break-words text-base font-bold leading-tight text-primary tabular-nums sm:text-xl", valueClassName)}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
