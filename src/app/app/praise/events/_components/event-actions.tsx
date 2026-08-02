"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, BarChart, Trash2 } from "lucide-react";

interface EventActionsProps {
  event: any;
  onEdit: (event: any) => void;
  onDelete: (event: any) => void;
  onViewDetails: (event: any) => void;
}

export function EventActions({ event, onEdit, onDelete, onViewDetails }: EventActionsProps) {
  const handleAction = (e: React.MouseEvent, action: () => void) => {
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
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={(e) => handleAction(e, () => onEdit(event))}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleAction(e, () => onDelete(event))} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleAction(e, () => onViewDetails(event))}>
            <BarChart className="h-4 w-4 mr-2" />
            Detalhes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}