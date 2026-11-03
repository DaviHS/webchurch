"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchPickListProps<T> {
  items: T[];
  getKey: (item: T) => number | string;
  renderItem: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  emptyMessage: string;
  isLoading?: boolean;
  label: string;
}

export function SearchPickList<T>({
  items,
  getKey,
  renderItem,
  onSelect,
  emptyMessage,
  isLoading = false,
  label,
}: SearchPickListProps<T>) {
  if (isLoading) {
    return <p className="rounded-lg border py-4 text-center text-sm text-muted-foreground">Carregando…</p>;
  }

  if (items.length === 0) {
    return <p className="rounded-lg border py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul aria-label={label} className="max-h-60 divide-y overflow-y-auto overscroll-contain rounded-lg border">
      {items.map((item) => (
        <li key={getKey(item)}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="flex min-h-11 w-full min-w-0 flex-col items-start justify-center px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-hidden"
          >
            {renderItem(item)}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface SelectedPickProps {
  children: ReactNode;
  onClear: () => void;
  clearLabel: string;
}

export function SelectedPick({ children, onClear, clearLabel }: SelectedPickProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 py-2 pl-3 pr-1">
      <div className="min-w-0 flex-1">{children}</div>
      <Button type="button" variant="ghost" size="icon" onClick={onClear} title={clearLabel} aria-label={clearLabel}>
        <X />
      </Button>
    </div>
  );
}
