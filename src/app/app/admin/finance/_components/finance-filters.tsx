"use client";

import type { DateRange } from "@daypicker/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/search-input";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { formatDate } from "@/lib/formatters";
import type { RouterOutputs } from "@/types";
import { TRANSACTION_TYPES } from "./format";

export type FinancialCategory = RouterOutputs["finance"]["listCategories"][number];

export interface FinanceFiltersState {
  startDate?: Date;
  endDate?: Date;
  type: string;
  categoryId?: number;
  search: string;
}

export const emptyFinanceFilters: FinanceFiltersState = {
  startDate: undefined,
  endDate: undefined,
  type: "",
  categoryId: undefined,
  search: "",
};

export function hasActiveFinanceFilters(filters: FinanceFiltersState): boolean {
  return (
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.type !== "" ||
    filters.categoryId !== undefined ||
    filters.search.trim() !== ""
  );
}

const ANY = "any";

interface FinanceFiltersProps {
  filters: FinanceFiltersState;
  onFiltersChange: (filters: FinanceFiltersState) => void;
  categories: FinancialCategory[];
}

export function FinanceFilters({ filters, onFiltersChange, categories }: FinanceFiltersProps) {
  const isMobile = useIsMobile();

  const handleDateSelect = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      startDate: range?.from,
      endDate: range?.to,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange(emptyFinanceFilters);
  };

  const hasFilters = hasActiveFinanceFilters(filters);
  const selectedCategoryName = categories.find((category) => category.id === filters.categoryId)?.name;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Buscar por descrição..."
          className="flex-1"
        />

        {hasFilters && (
          <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
            <X />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          Filtros:
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal sm:w-[280px]",
                !filters.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              <span className="truncate">
                {filters.startDate
                  ? filters.endDate
                    ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
                    : formatDate(filters.startDate)
                  : "Selecione o período"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filters.startDate,
                to: filters.endDate,
              }}
              onSelect={handleDateSelect}
              numberOfMonths={isMobile ? 1 : 2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.type}
          onValueChange={(value) => onFiltersChange({ ...filters, type: value === ANY ? "" : value })}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos os tipos</SelectItem>
            {Object.entries(TRANSACTION_TYPES).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId === undefined ? "" : String(filters.categoryId)}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, categoryId: value === ANY ? undefined : Number(value) })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.startDate && filters.endDate && (
            <Badge variant="secondary" className="text-xs">
              Período: {format(filters.startDate, "dd/MM/yy", { locale: ptBR })} -{" "}
              {format(filters.endDate, "dd/MM/yy", { locale: ptBR })}
            </Badge>
          )}
          {filters.type !== "" && (
            <Badge variant="secondary" className="text-xs">
              Tipo: {TRANSACTION_TYPES[filters.type]?.label ?? filters.type}
            </Badge>
          )}
          {selectedCategoryName !== undefined && (
            <Badge variant="secondary" className="text-xs">
              Categoria: {selectedCategoryName}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
