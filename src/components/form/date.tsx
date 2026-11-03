"use client"

import { useId } from "react"
import { CalendarIcon } from "lucide-react"
import { useFormContext, useWatch } from "react-hook-form"
import type { DateRange, OnSelectHandler } from "@daypicker/react"
import { format, setDefaultOptions, parseISO } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ptBR } from "date-fns/locale"

setDefaultOptions({ locale: ptBR })

const parseDatePreservingTimezone = (dateString: string): Date => {
  if (!dateString) return new Date()

  if (dateString.includes("T") || dateString.includes("Z")) {
    return parseISO(dateString)
  }

  const [year, month, day] = dateString.split(/[-T]/).map(Number)

  if (!isNaN(year!) && !isNaN(month!) && !isNaN(day!)) {
    return new Date(year!, month! - 1, day, 0, 0, 0)
  }

  const date = new Date(dateString)
  date.setHours(12, 0, 0, 0)
  return date
}

const toValidDate = (value: unknown): Date | undefined => {
  let date: Date | undefined
  if (value instanceof Date) date = value
  else if (typeof value === "string" && value !== "") date = parseDatePreservingTimezone(value)
  return date && !isNaN(date.getTime()) ? date : undefined
}

interface DateRangePickerProps {
  label: string
  placeholder?: string
  className?: string
}

export const DateRangePicker = ({ label, placeholder, className }: DateRangePickerProps) => {
  const id = useId()
  const form = useFormContext()

  const fromDate = toValidDate(useWatch({ control: form.control, name: "date_ini" }))
  const toDate = toValidDate(useWatch({ control: form.control, name: "date_fim" }))
  const date: DateRange | undefined = fromDate ? { from: fromDate, to: toDate ?? fromDate } : undefined

  const handleOnSelect: OnSelectHandler<DateRange | undefined> = (value) => {
    if (!value) {
      form.setValue("date_fim", form.getValues("date_ini"))
      return
    }

    if (value.from) {
      const from = new Date(value.from)
      from.setHours(12, 0, 0, 0)
      form.setValue("date_ini", from)

      const to = value.to ? new Date(value.to) : from
      to.setHours(12, 0, 0, 0)
      form.setValue("date_fim", to)
    }
  }

  return (
    <div className={className}>
      <div className="not-first:*:mt-2 space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant={"outline"}
              className={cn(
                "group w-full justify-between border-input bg-background px-3 font-normal outline-hidden outline-offset-0 hover:bg-background focus-visible:outline-[3px]",
                !date && "text-muted-foreground",
              )}
            >
              <span className={cn("truncate", !date && "text-muted-foreground")}>
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd LLL, y")} - {format(date.to, "dd LLL, y")}
                    </>
                  ) : (
                    format(date.from, "dd LLL, y")
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

