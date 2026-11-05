"use client";

import { api } from "@/trpc/react";
import type { Permission } from "@/lib/permissions";

export function usePermissions() {
  const { data, isPending } = api.access.me.useQuery(undefined, { staleTime: 60_000 });
  const granted = new Set<string>(data?.permissions);

  return {
    isLoading: isPending,
    isAdmin: data?.isAdmin ?? false,
    can: (permission?: Permission) => permission === undefined || granted.has(permission),
  };
}

export type CanFn = ReturnType<typeof usePermissions>["can"];
