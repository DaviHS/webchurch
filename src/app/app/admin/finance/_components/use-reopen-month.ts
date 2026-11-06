"use client";

import { useConfirm } from "@/components/confirm-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import { formatMonthYear, type MonthRef } from "./format";

export function useReopenMonth() {
  const confirm = useConfirm();
  const utils = api.useUtils();

  const reopenMonthMutation = api.finance.reopenMonth.useMutation(
    mutationFeedback({
      loading: "Reabrindo o mês...",
      success: "Mês reaberto com sucesso",
      error: "Erro ao reabrir mês",
      onSuccess: () => utils.finance.invalidate(),
    })
  );

  const handleReopen = async (ref: MonthRef) => {
    const confirmed = await confirm({
      title: `Reabrir ${formatMonthYear(ref).toLocaleLowerCase("pt-BR")}?`,
      description: "Os lançamentos voltam a poder ser alterados.",
      confirmLabel: "Reabrir mês",
      destructive: true,
    });
    if (confirmed) reopenMonthMutation.mutate(ref);
  };

  return { handleReopen, isReopening: reopenMonthMutation.isPending };
}
