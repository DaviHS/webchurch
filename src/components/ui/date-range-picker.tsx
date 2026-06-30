"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecione o período",
  className,
  disabled = false,
  closeOnSelect = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: any) => {
    onChange({
      from: range?.from,
      to: range?.to,
    });
    
    if (closeOnSelect && range?.from && range?.to) {
      setTimeout(() => setOpen(false), 300);
    }
  };

  const formatDateRange = () => {
    if (value.from && value.to) {
      return `${format(value.from, "dd/MM/yyyy")} - ${format(value.to, "dd/MM/yyyy")}`;
    }
    if (value.from) {
      return `${format(value.from, "dd/MM/yyyy")} - ...`;
    }
    return placeholder;
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value.from && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <CalendarRange className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: value.from,
            to: value.to,
          }}
          onSelect={handleSelect}
          initialFocus
          locale={ptBR}
          numberOfMonths={2}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}