"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { ErrorState, errorCode } from "@/components/error-state";

export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      icon={<TriangleAlert />}
      title="Algo deu errado"
      description="Não foi possível abrir esta página. Tente de novo; se continuar, avise o setor de desenvolvimento."
      code={errorCode(error)}
      onRetry={retry}
      redirectAfter={12}
      homeHref="/"
    />
  );
}
