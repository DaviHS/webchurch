"use client"
import { X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useFormContext } from "react-hook-form"

export type Option = {
  label: string
  value: string
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

const MAX_VISIBLE_BADGES = 5

interface MultiSelectProps {
  options: Option[]
  placeholder?: string
  name: string
  label?: string
  className?: string
}

export function MultiSelect({
  options,
  placeholder = "Selecione opções...",
  name,
  label,
  className,
}: MultiSelectProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selected = toStringArray(field.value)
        const visibleBadges = selected.slice(0, MAX_VISIBLE_BADGES)
        const hiddenBadgesCount = selected.length - MAX_VISIBLE_BADGES
        const toggle = (value: string) => {
          field.onChange(
            selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
          )
        }

        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-within:outline-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                      "cursor-pointer",
                    )}
                  >
                    {selected.length > 0 ? (
                      <div className="flex flex-nowrap gap-1.5 overflow-x-hidden">
                        {visibleBadges.map((item) => (
                          <Badge variant="secondary" key={item} className="flex items-center gap-1 px-2">
                            {options.find((option) => option.value === item)?.label}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggle(item)
                              }}
                              aria-label={`Remover ${options.find((option) => option.value === item)?.label ?? item}`}
                              className="ml-1 rounded-full hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {hiddenBadgesCount > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1 px-2">
                            +{hiddenBadgesCount}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{placeholder}</span>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar..." />
                    <CommandList>
                      <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {options.map((option) => (
                          <CommandItem
                            key={option.value}
                            onSelect={() => toggle(option.value)}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selected.includes(option.value)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

