import type { TooltipContentProps } from "recharts";

interface ChartPayload {
  artist: string | null;
}

function isChartPayload(value: unknown): value is ChartPayload {
  if (typeof value !== "object" || value === null || !("artist" in value)) return false;
  return typeof value.artist === "string" || value.artist === null;
}

export function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  const entry = payload[0];
  if (!active || !entry) return null;

  const data: unknown = entry.payload;
  const artist = isChartPayload(data) && data.artist ? data.artist : "Artista desconhecido";

  return (
    <div className="bg-popover text-popover-foreground p-3 border rounded-lg shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-muted-foreground">{artist}</p>
      <p className="font-medium text-primary">
        {String(entry.value)} execuções
      </p>
    </div>
  );
}
