import { SearchInput } from "@/components/search-input";
import { eventTypeLabel, SELECTABLE_EVENT_TYPES } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type EventScope = "upcoming" | "past";

const SCOPES: { value: EventScope; label: string }[] = [
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Passados" },
];

interface EventFiltersProps {
  scope: EventScope;
  onScopeChange: (value: EventScope) => void;
  search: string;
  onSearchChange: (value: string) => void;
  /** "" ou "any" = todos os tipos. */
  type: string;
  onTypeChange: (value: string) => void;
  isSearching?: boolean;
  /** Tipos que existem na lista atual: só eles viram chip. Com um tipo só, os chips nem aparecem. */
  availableTypes: string[];
}

/** Próximos/passados num alternador, busca e tipos em chips: tudo a um toque, sem abrir listas. */
export function EventFilters({ scope, onScopeChange, search, onSearchChange, type, onTypeChange, isSearching = false, availableTypes }: EventFiltersProps) {
  const activeType = type === "" ? "any" : type;
  const existing = SELECTABLE_EVENT_TYPES.filter((value) => availableTypes.includes(value));
  const types = [{ value: "any", label: "Todos" }, ...existing.map((value) => ({ value, label: eventTypeLabel(value) }))];
  // Se o tipo escolhido deixou de existir (ao trocar de aba), o chip dele continua para poder ser desmarcado.
  if (activeType !== "any" && !existing.includes(activeType as (typeof SELECTABLE_EVENT_TYPES)[number])) {
    types.push({ value: activeType, label: eventTypeLabel(activeType) });
  }
  const showTypes = types.length > 2 || activeType !== "any";

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Período dos eventos" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {SCOPES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={scope === option.value}
            onClick={() => onScopeChange(option.value)}
            className={cn(
              "min-h-10 rounded-md text-sm font-medium transition-colors",
              scope === option.value ? "bg-background shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SearchInput value={search} onChange={onSearchChange} placeholder="Buscar eventos…" isLoading={isSearching} />

      {showTypes && (
      <div
        role="radiogroup"
        aria-label="Tipo de evento"
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {types.map((option) => {
          const active = activeType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onTypeChange(option.value)}
              className={cn(
                "min-h-10 shrink-0 snap-start rounded-full border px-4 text-sm font-medium transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}
