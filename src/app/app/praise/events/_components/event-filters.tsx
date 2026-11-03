import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/search-input";
import { eventTypeLabel, SELECTABLE_EVENT_TYPES } from "@/lib/labels";

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  isSearching?: boolean;
}

export function EventFilters({ search, onSearchChange, type, onTypeChange, isSearching = false }: EventFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar eventos…"
        isLoading={isSearching}
        className="sm:flex-1"
      />

      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por tipo">
          <SelectValue placeholder="Todos os tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Todos os tipos</SelectItem>
          {SELECTABLE_EVENT_TYPES.map((eventType) => (
            <SelectItem key={eventType} value={eventType}>
              {eventTypeLabel(eventType)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
