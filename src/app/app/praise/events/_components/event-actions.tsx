"use client";

import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Edit, MoreVertical, BarChart, Trash2, Projector } from "lucide-react";
import type { EventData } from "@/types";

interface EventActionsProps {
  event: EventData;
  onEdit: (event: EventData) => void;
  onDelete: (event: EventData) => void;
  onViewDetails: (event: EventData) => void;
}

export function EventActions({ event, onEdit, onDelete, onViewDetails }: EventActionsProps) {
  const handleAction = (e: MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className="flex justify-between items-center gap-1">
      <Button
        variant="default"
        size="sm"
        onClick={(e) => handleAction(e, () => onViewDetails(event))}
        title="Ver detalhes do evento"
        className="h-6 w-6 p-0"
      >
        <BarChart className="h-3 w-3" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={(e) => handleAction(e, () => onEdit(event))}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleAction(e, () => onDelete(event))} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleAction(e, () => onViewDetails(event))}>
            <BarChart className="h-4 w-4 mr-2" />
            Detalhes
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/presentation/control?event=${event.id}`} onClick={(e) => e.stopPropagation()}>
              <Projector className="h-4 w-4 mr-2" />
              Apresentar
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
