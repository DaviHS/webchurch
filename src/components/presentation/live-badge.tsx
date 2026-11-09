import { cn } from "@/lib/utils";

/** Selo "AO VIVO" / "PRÓXIMA" usado no console, no repertório e no controle remoto. */
export function LiveBadge({ kind, className }: { kind: "live" | "next"; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-xs font-bold leading-none text-white",
        kind === "live" ? "bg-red-600" : "bg-sky-600 dark:bg-sky-500",
        className,
      )}
    >
      {kind === "live" ? "AO VIVO" : "PRÓXIMA"}
    </span>
  );
}
