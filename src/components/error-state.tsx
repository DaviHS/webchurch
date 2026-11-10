"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  code?: string;
  onRetry?: () => void;
  homeHref?: string;
  redirectAfter?: number;
}

export function ErrorState({ icon, title, description, code, onRetry, homeHref = "/app", redirectAfter }: ErrorStateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const redirects = redirectAfter !== undefined && pathname !== homeHref;
  const [left, setLeft] = useState(redirectAfter ?? 0);

  useEffect(() => {
    if (!redirects) return;
    const timer = setInterval(() => setLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [redirects]);

  useEffect(() => {
    if (redirects && left <= 0) router.replace(homeHref);
  }, [redirects, left, router, homeHref]);

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
      {redirects && left > 0 && (
        <p className="text-xs text-muted-foreground">Voltando para o início em {left}s…</p>
      )}
      {code && <p className="text-xs text-muted-foreground">Código do erro: {code}</p>}
    </div>
  );
}

export function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) return undefined;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" ? digest : undefined;
}
