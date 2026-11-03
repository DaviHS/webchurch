"use client"

import { Loader2, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
  "aria-label"?: string
}

export function SearchInput({ value, onChange, placeholder = "Buscar…", isLoading = false, className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? placeholder}
        className="pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
        {isLoading ? (
          <Loader2 className="mr-2 size-4 animate-spin text-muted-foreground" />
        ) : (
          value !== "" && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </div>
    </div>
  )
}
