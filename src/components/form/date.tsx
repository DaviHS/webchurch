"use client"

import { useId, useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { useFormContext } from "react-hook-form"
import type { SelectRangeEventHandler, DateRange } from "react-day-picker"
import { format, setDefaultOptions, parseISO } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ptBR } from "date-fns/locale"

setDefaultOptions({ locale: ptBR })

// Função auxiliar para converter string para Date preservando o fuso horário local
const parseDatePreservingTimezone = (dateString: string): Date => {
  if (!dateString) return new Date()

  // Se for uma string ISO, use parseISO
  if (dateString.includes("T") || dateString.includes("Z")) {
    return parseISO(dateString)
  }

  // Para outros formatos de string, crie uma data local
  const [year, month, day] = dateString.split(/[-T]/).map(Number)

  // Se conseguimos extrair ano, mês e dia, crie uma data local
  if (!isNaN(year!) && !isNaN(month!) && !isNaN(day!)) {
    // Mês em JavaScript é baseado em zero (0-11)
    return new Date(year!, month! - 1, day, 0, 0, 0)
  }

  // Fallback: crie uma data local a partir da string, mas ajuste para meio-dia
  // para evitar problemas de fuso horário
  const date = new Date(dateString)
  date.setHours(12, 0, 0, 0)
  return date
}

interface DateRangePickerProps {
  label: string
  placeholder?: string
  className?: string
}

export const DateRangePicker = ({ label, placeholder, className }: DateRangePickerProps) => {
  const id = useId()
  const [date, setDate] = useState<DateRange | undefined>()
  const form = useFormContext()

  // Get the current form values for date_ini and date_fim
  const dateIni = form.watch("date_ini")
  const dateFim = form.watch("date_fim")

  // Synchronize the component's internal state with form values
  useEffect(() => {
    if (dateIni) {
      const fromDate = typeof dateIni === "string" ? parseDatePreservingTimezone(dateIni) : dateIni

      const toDate = dateFim ? (typeof dateFim === "string" ? parseDatePreservingTimezone(dateFim) : dateFim) : fromDate

      // Only update if the dates are valid
      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        setDate({
          from: fromDate,
          to: toDate,
        })
      }
    }
  }, [dateIni, dateFim])

  const handleOnSelect: SelectRangeEventHandler = (value) => {  
    if (!value) {
      const currentIniDate = form.getValues("date_ini")
      form.setValue("date_fim", currentIniDate)
      setDate({ from: currentIniDate, to: currentIniDate })
      return
    }
  
    if (value.from) {
      const fromDate = new Date(value.from)
      fromDate.setHours(12, 0, 0, 0)
  
      form.setValue("date_ini", fromDate)
  
      if (!value.to) {
        form.setValue("date_fim", fromDate)
        setDate({ from: fromDate, to: fromDate })
      } else {
        const toDate = new Date(value.to)
        toDate.setHours(12, 0, 0, 0)
  
        form.setValue("date_fim", toDate)
        setDate({ from: fromDate, to: toDate })
      }
    }
  }

  return (
    <div className={className}>
      <div className="*:not-first:mt-2 space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant={"outline"}
              className={cn(
                "group w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]",
                !date && "text-muted-foreground",
              )}
            >
              <span className={cn("truncate", !date && "text-muted-foreground")}>
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd LLL, y")} - {format(date.to, " dd LLL, y")}
                    </>
                  ) : (
                    format(date.from, " dd LLL, y")
                  )
                ) : (
                  placeholder
                )}
              </span>
              <CalendarIcon
                size={16}
                className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <Calendar mode="range" locale={ptBR} selected={date} onSelect={handleOnSelect} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

