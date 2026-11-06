"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Código para achar o erro nos registros do servidor. */
  code?: string;
  onRetry?: () => void;
  homeHref?: string;
}

export function ErrorState({ icon, title, description, code, onRetry, homeHref = "/app" }: ErrorStateProps) {
  return (
    <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-7">{icon}</div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {onRetry && <Button onClick={onRetry}>Tentar de novo</Button>}
        <Button asChild variant="outline">
          <Link href={homeHref}>Ir para o início</Link>
        </Button>
      </div>
      {code && <p className="text-xs text-muted-foreground">Código do erro: {code}</p>}
    </div>
  );
}

/** Código curto do erro (digest do Next), quando houver, para achar nos registros do servidor. */
export function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) return undefined;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" ? digest : undefined;
}
