"use client";

import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TRANSACTION_TYPES, type TransactionType } from "./format";

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}

const OPTIONS: { value: TransactionType; icon: typeof ArrowUpCircle; activeClassName: string }[] = [
  { value: "income", icon: ArrowUpCircle, activeClassName: "border-success bg-success/10 text-success hover:bg-success/15 hover:text-success" },
  {
    value: "expense",
    icon: ArrowDownCircle,
    activeClassName: "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive",
  },
];

export function TransactionTypeToggle({ value, onChange }: TransactionTypeToggleProps) {
  return (
    <div role="group" aria-label="Tipo" className="grid grid-cols-2 gap-2">
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(isActive && option.activeClassName)}
          >
            <option.icon />
            {TRANSACTION_TYPES[option.value].label}
          </Button>
        );
      })}
    </div>
  );
}
