"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface FinanceFiltersProps {
  filters: {
    startDate?: Date;
    endDate?: Date;
    type: string;
    categoryId?: number;
  };
  onFiltersChange: (filters: any) => void;
  categories: any[];
}

export function FinanceFilters({ filters, onFiltersChange, categories }: FinanceFiltersProps) {
  const [search, setSearch] = useState("");

  const handleDateSelect = (range: any) => {
    onFiltersChange({
      ...filters,
      startDate: range?.from,
      endDate: range?.to,
    });
  };

  const clearFilters = () => {
    setSearch("");
    onFiltersChange({
      startDate: undefined,
      endDate: undefined,
      type: "",
      categoryId: undefined,
    });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.type || filters.categoryId;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
            <SelectItem value="transfer">Transferências</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId?.toString() || ""}
          onValueChange={(value) => onFiltersChange({ ...filters, categoryId: value ? parseInt(value) : undefined })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Todas categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
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
          {filters.type && (
            <Badge variant="secondary" className="text-xs">
              Tipo: {filters.type === 'income' ? 'Receitas' : filters.type === 'expense' ? 'Despesas' : 'Transferências'}
            </Badge>
          )}
          {filters.categoryId && (
            <Badge variant="secondary" className="text-xs">
              Categoria: {categories.find(c => c.id === filters.categoryId)?.name}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}