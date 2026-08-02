import { Button } from "@/components/ui/button";

interface SongPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  showing: number;
  onPageChange: (page: number) => void;
}

export function SongPagination({ page, totalPages, total, showing, onPageChange }: SongPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
      <div className="text-sm text-muted-foreground">
        Mostrando {showing} de {total} músicas
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Anterior
        </Button>
        <span className="flex items-center px-4 text-sm">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}