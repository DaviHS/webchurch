"use client";

import { useState } from "react";
import { useCreateRequest } from "@/hooks/use-create-request";

export function useEntityDialog<T>({ fromUrl = false }: { fromUrl?: boolean } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const createRequest = useCreateRequest();
  const requestedFromUrl = fromUrl && createRequest.requested && !isOpen;

  const close = () => {
    setIsOpen(false);
    if (fromUrl) createRequest.dismiss();
  };

  return {
    open: isOpen || requestedFromUrl,
    editing: requestedFromUrl ? null : editing,
    isEditing: !requestedFromUrl && editing !== null,
    openCreate: () => {
      setEditing(null);
      setIsOpen(true);
    },
    openEdit: (item: T) => {
      setEditing(item);
      setIsOpen(true);
    },
    close,
    onOpenChange: (open: boolean) => {
      if (open) setIsOpen(true);
      else close();
    },
  };
}
