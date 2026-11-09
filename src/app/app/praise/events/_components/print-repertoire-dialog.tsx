"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingState } from "@/components/ui/loading-state";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { formatEventWhen, formatTime, fullName } from "@/lib/formatters";
import { eventTypeLabel } from "@/lib/labels";
import { api } from "@/trpc/react";

interface PrintRepertoireDialogProps {
  eventId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Folha do repertório para a banda, numa janela sobre a própria tela: confere e imprime (ou salva em PDF). */
export function PrintRepertoireDialog({ eventId, open, onOpenChange }: PrintRepertoireDialogProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { data: event, isLoading, error, refetch } = api.event.getById.useQuery(eventId ?? 0, {
    enabled: open && eventId !== null,
  });

  const print = useReactToPrint({
    contentRef: sheetRef,
    documentTitle: event ? `Repertório - ${event.title}` : "Repertório",
    pageStyle: "@page { margin: 16mm; } body { -webkit-print-color-adjust: exact; }",
  });

  const songs = [...(event?.songs ?? [])].sort((a, b) => a.order - b.order);
  const passages = [...(event?.passages ?? [])].sort((a, b) => a.order - b.order);
  const before = passages.filter((passage) => passage.placement === "before");
  const after = passages.filter((passage) => passage.placement !== "before");
  const time = event ? [formatTime(event.startTime), formatTime(event.endTime)].filter(Boolean).join(" – ") : "";

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Folha do repertório</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Confira e imprima, ou escolha “Salvar como PDF” na impressão.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorDisplay message={error.message} onRetry={() => void refetch()} className="mt-0" />
          ) : !event ? (
            <ErrorDisplay title="Evento não encontrado" message="Ele pode ter sido excluído." className="mt-0" />
          ) : (
            <div ref={sheetRef} className="space-y-5 rounded-lg border bg-card p-4 text-card-foreground print:border-0">
              <header className="space-y-1 border-b pb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{eventTypeLabel(event.type)}</p>
                <h2 className="break-words text-xl font-bold leading-tight">{event.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatEventWhen(event.date, event.startTime)}
                  {time && event.endTime ? ` (${time})` : ""}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
                {(event.preacher ?? event.bibleVerse) && (
                  <p className="text-sm">
                    {event.preacher && <span>Pregador: {event.preacher}</span>}
                    {event.preacher && event.bibleVerse && " · "}
                    {event.bibleVerse && <span>{event.bibleVerse}</span>}
                  </p>
                )}
              </header>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Repertório</h3>
                {songs.length + passages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma música ou passagem neste evento.</p>
                ) : (
                  <ol className="space-y-2">
                    {before.map((passage) => (
                      <li key={`p-${passage.id}`} className="break-inside-avoid rounded-md border border-dashed p-2 text-sm">
                        <span className="font-medium">Leitura:</span> {passage.reference} ({passage.versionCode})
                      </li>
                    ))}
                    {songs.map((item, index) => (
                      <li key={item.id} className="flex break-inside-avoid gap-3 rounded-md border p-2">
                        <span className="w-6 shrink-0 text-right text-lg font-bold tabular-nums">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold leading-tight">{item.song?.title ?? "Música removida"}</p>
                          {item.song?.artist && <p className="text-sm text-muted-foreground">{item.song.artist}</p>}
                          {item.leader && <p className="text-sm">Líder: {fullName(item.leader)}</p>}
                          {item.notes && <p className="break-words text-sm italic text-muted-foreground">{item.notes}</p>}
                        </div>
                      </li>
                    ))}
                    {after.map((passage) => (
                      <li key={`p-${passage.id}`} className="break-inside-avoid rounded-md border border-dashed p-2 text-sm">
                        <span className="font-medium">Leitura:</span> {passage.reference} ({passage.versionCode})
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {event.participants.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Equipe</h3>
                  <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {event.participants.map((participant) => (
                      <li key={participant.id} className="break-inside-avoid">
                        <span className="font-medium">{fullName(participant.member)}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {participant.role}
                          {participant.instrument ? ` (${participant.instrument})` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </ResponsiveDialogClose>
          <Button onClick={() => void print()} disabled={!event}>
            <Printer />
            Imprimir
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
