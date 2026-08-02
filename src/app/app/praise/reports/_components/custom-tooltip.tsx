interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0]?.payload?.artist || "Artista desconhecido"}
        </p>
        <p className="font-medium text-primary">
          {payload[0]?.value} execuções
        </p>
      </div>
    );
  }
  return null;
}