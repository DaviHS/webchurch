import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationBarProps {
  page: number
  onPageChange: (page: number) => void
  totalPages?: number
  total?: number
  showing?: number
  itemLabel?: string
  hasNextPage?: boolean
}

export function PaginationBar({
  page,
  onPageChange,
  totalPages,
  total,
  showing,
  itemLabel = "itens",
  hasNextPage,
}: PaginationBarProps) {
  const changePage = (next: number) => {
    onPageChange(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const canGoNext = totalPages !== undefined ? page < totalPages : Boolean(hasNextPage)
  if (page <= 1 && !canGoNext) return null

  return (
    <nav aria-label="Paginação" className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
      {total !== undefined && showing !== undefined && (
        <p className="text-sm text-muted-foreground">
          Mostrando {showing} de {total} {itemLabel}
        </p>
      )}
      <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => changePage(page - 1)} disabled={page <= 1}>
          <ChevronLeft />
          Anterior
        </Button>
        <span className="shrink-0 px-2 text-sm tabular-nums text-muted-foreground">
          {totalPages !== undefined ? `${page} de ${totalPages}` : `Página ${page}`}
        </span>
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => changePage(page + 1)} disabled={!canGoNext}>
          Próxima
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
