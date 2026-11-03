"use client";

import type { DateRange } from "@daypicker/react";
import { CalendarIcon, X } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchInput } from "@/components/search-input";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { TRANSACTION_TYPES, type TransactionType } from "./format";

export type FinancialCategory = RouterOutputs["finance"]["listCategories"][number];

export interface FinanceFiltersState {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  categoryId?: number;
  search: string;
}

export const emptyFinanceFilters: FinanceFiltersState = { search: "" };

export function hasActiveFinanceFilters(filters: FinanceFiltersState): boolean {
  return (
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.type !== undefined ||
    filters.categoryId !== undefined ||
    filters.search.trim() !== ""
  );
}

const ANY = "any";

interface FinanceFiltersProps {
  filters: FinanceFiltersState;
  onFiltersChange: (filters: FinanceFiltersState) => void;
  categories: FinancialCategory[];
  isSearching?: boolean;
}

export function FinanceFilters({ filters, onFiltersChange, categories, isSearching }: FinanceFiltersProps) {
  const isMobile = useIsMobile();

  const handleDateSelect = (range: DateRange | undefined) => {
    onFiltersChange({ ...filters, startDate: range?.from, endDate: range?.to });
  };

  const handleTypeChange = (value: string) => {
    const type = value === "income" || value === "expense" ? value : undefined;
    const category = categories.find((item) => item.id === filters.categoryId);
    const keepCategory = !type || !category || category.type === type;
    onFiltersChange({ ...filters, type, categoryId: keepCategory ? filters.categoryId : undefined });
  };

  const visibleCategories = filters.type ? categories.filter((category) => category.type === filters.type) : categories;
  const periodLabel = filters.startDate
    ? filters.endDate
      ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
      : formatDate(filters.startDate)
    : "Qualquer data";

  return (
    <div className="space-y-3">
      <SearchInput
        value={filters.search}
        onChange={(search) => onFiltersChange({ ...filters, search })}
        placeholder="Buscar pela descrição..."
        isLoading={isSearching}
      />

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "col-span-2 w-full justify-start text-left font-normal sm:w-[260px]",
                !filters.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              <span className="truncate">{periodLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: filters.startDate, to: filters.endDate }}
              onSelect={handleDateSelect}
              numberOfMonths={isMobile ? 1 : 2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Select value={filters.type ?? ANY} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-[150px]" aria-label="Tipo">
            <SelectValue placeholder="Entradas e saídas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Entradas e saídas</SelectItem>
            {Object.entries(TRANSACTION_TYPES).map(([value, { plural }]) => (
              <SelectItem key={value} value={value}>
                {plural}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId === undefined ? ANY : String(filters.categoryId)}
          onValueChange={(value) => onFiltersChange({ ...filters, categoryId: value === ANY ? undefined : Number(value) })}
        >
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Categoria">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas as categorias</SelectItem>
            {visibleCategories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFinanceFilters(filters) && (
          <Button variant="ghost" onClick={() => onFiltersChange(emptyFinanceFilters)} className="col-span-2 sm:w-auto">
            <X />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
