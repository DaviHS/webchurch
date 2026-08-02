import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SongEmptyStateProps {
  onCreateClick: () => void;
}

export function SongEmptyState({ onCreateClick }: SongEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Nenhuma música encontrada</p>
      <Button variant="outline" className="mt-4" onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Criar primeira música
      </Button>
    </div>
  );
}