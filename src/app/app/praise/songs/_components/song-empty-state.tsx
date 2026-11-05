import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Music, Plus, SearchX } from "lucide-react";

interface SongEmptyStateProps {
  onCreateClick?: () => void;
  filtered?: boolean;
}

export function SongEmptyState({ onCreateClick, filtered = false }: SongEmptyStateProps) {
  if (filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nenhuma música encontrada"
        description="Tente buscar por outro termo ou trocar a categoria."
      />
    );
  }

  return (
    <EmptyState
      icon={Music}
      title="Nenhuma música cadastrada"
      description={onCreateClick ? "Cadastre a primeira música do repertório." : "Ainda não há músicas cadastradas."}
      action={
        onCreateClick && (
          <Button variant="outline" onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Nova música
          </Button>
        )
      }
    />
  );
}
