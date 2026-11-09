"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleAddPanelProps {
  title: string;
  children: ReactNode;
}

export function CollapsibleAddPanel({ title, children }: CollapsibleAddPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-md border">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="h-auto min-h-12 w-full justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <Plus />
            {title}
          </span>
          <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 border-t p-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
