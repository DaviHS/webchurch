"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CloudOff, Loader2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { REMOTE_CODE_LENGTH, remoteCodeSchema } from "../remote-protocol";

const LIST_REFRESH_MS = 3000;

export function RemotePicker({ error, onSelect }: { error?: string; onSelect: (code: string) => void }) {
  const [value, setValue] = useState("");
  const valid = remoteCodeSchema.safeParse(value).success;
  const sessions = api.remote.listSessions.useQuery(undefined, { refetchInterval: LIST_REFRESH_MS, staleTime: 0 });

  if (sessions.error?.data?.code === "UNAUTHORIZED") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <CloudOff className="size-10 text-muted-foreground" />
        <p className="max-w-xs">Entre com a sua conta para controlar a projeção.</p>
        <Button asChild>
          <Link href="/sign-in">Entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-bold">Controle remoto</h1>
        <p className="text-sm text-muted-foreground">Escolha o repertório que está sendo projetado.</p>
      </header>

      <section className="space-y-2" aria-label="Repertórios ativos">
        {sessions.isPending && (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
        {sessions.data?.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhum computador conectado agora. Abra o console de projeção e ative o controle remoto, ou digite o código
            abaixo.
          </p>
        )}
        {sessions.data?.map((session) => (
          <button
            key={session.code}
            type="button"
            onClick={() => onSelect(session.code)}
            className="flex min-h-16 w-full items-center gap-3 rounded-md border p-3 text-left active:bg-accent"
          >
            <Monitor className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{session.title || "Projeção"}</span>
              <span className="block text-xs text-muted-foreground">código {session.code}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </section>

      <form
        className="space-y-3 border-t pt-4 text-center"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSelect(value);
        }}
      >
        <p className="text-sm text-muted-foreground">Ou digite o código de {REMOTE_CODE_LENGTH} números:</p>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, REMOTE_CODE_LENGTH))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000"
          aria-label="Código do controle remoto"
          className="mx-auto h-14 max-w-48 text-center text-3xl font-bold tracking-[0.3em] tabular-nums"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full max-w-48" disabled={!valid}>
          Conectar
        </Button>
      </form>
    </div>
  );
}
