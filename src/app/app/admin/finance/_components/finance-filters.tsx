"use client";

import type { DateRange } from "@daypicker/react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RouterOutputs } from "@/types";

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

const ANY = "any";

const typeLabels: Record<string, string> = {
  income: "Receitas",
  expense: "Despesas",
  transfer: "Transferências",
};

interface FinanceFiltersProps {
  filters: FinanceFiltersState;
  onFiltersChange: (filters: FinanceFiltersState) => void;
  categories: FinancialCategory[];
}

export function FinanceFilters({ filters, onFiltersChange, categories }: FinanceFiltersProps) {
  const handleDateSelect = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      startDate: range?.from,
      endDate: range?.to,
    });
  };

  const clearFilters = () => {
    onFiltersChange(emptyFinanceFilters);
  };

  const hasActiveFilters =
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.type !== "" ||
    filters.categoryId !== undefined ||
    filters.search !== "";

  const selectedCategoryName = categories.find((c) => c.id === filters.categoryId)?.name;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[280px] justify-start text-left font-normal",
                !filters.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? (
                filters.endDate ? (
                  <>
                    {format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                "Selecione o período"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filters.startDate,
                to: filters.endDate,
              }}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.type}
          onValueChange={(value) => onFiltersChange({ ...filters, type: value === ANY ? "" : value })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
            <SelectItem value="transfer">Transferências</SelectItem>
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

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.startDate && filters.endDate && (
            <Badge variant="secondary" className="text-xs">
              Período: {format(filters.startDate, "dd/MM/yy", { locale: ptBR })} - {format(filters.endDate, "dd/MM/yy", { locale: ptBR })}
            </Badge>
          )}
          {filters.type !== "" && (
            <Badge variant="secondary" className="text-xs">
              Tipo: {typeLabels[filters.type] ?? filters.type}
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
