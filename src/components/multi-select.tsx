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
  const maxVisibleBadges = 5 // Ajuste para o número máximo de badges visíveis

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        // Calcular o número de badges visíveis
        const visibleBadges = field.value?.slice(0, maxVisibleBadges)
        const hiddenBadgesCount = field.value?.length - maxVisibleBadges

        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                      "cursor-pointer",
                    )}
                  >
                    {field.value?.length > 0 ? (
                      <div className="flex flex-nowrap gap-1.5 overflow-x-hidden">
                        {visibleBadges?.map((item: string) => (
                          <Badge variant="secondary" key={item} className="flex items-center gap-1 px-2">
                            {options.find((option) => option.value === item)?.label}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                field.onChange(field.value.filter((i: string) => i !== item))
                              }}
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
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar..." />
                    <CommandList>
                      <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {options.map((option) => (
                          <CommandItem
                            key={option.value}
                            onSelect={() => {
                              const currentValues = field.value || []
                              const newValue = currentValues.includes(option.value)
                                ? currentValues.filter((value: string) => value !== option.value)
                                : [...currentValues, option.value]
                              field.onChange(newValue)
                            }}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                field.value?.includes(option.value)
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

