"use client";

import { use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useReactToPrint } from 'react-to-print';

export default function PrintEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use o hook use para resolver a Promise
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);

  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const { data: event, isLoading } = api.event.getById.useQuery(eventId);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  } as any);

  if (isLoading) return <div>Carregando...</div>;
  if (!event) return <div>Evento não encontrado</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Imprimir Repertório</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />
          Salvar PDF
        </Button>
      </div>

      <div ref={printRef} className="bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-lg">
            {new Date(event.date).toLocaleDateString('pt-BR')}
            {event.location && ` • ${event.location}`}
          </p>
        </div>

        <div className="space-y-4">
          {event.songs.map((item, index) => (
            <div key={item.eventSong.id} className="border-b pb-4">
              <div className="flex items-start gap-4">
                <div className="w-8 text-center font-bold text-lg">{index + 1}.</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.song?.title}</h3>
                  <p className="text-muted-foreground">{item.song?.artist}</p>
                  {item.leader && (
                    <p className="text-sm">Líder: {item.leader.firstName} {item.leader.lastName}</p>
                  )}
                  {item.eventSong.notes && (
                    <p className="text-sm italic">Obs: {item.eventSong.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {event.participants.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Participantes</h2>
            <div className="grid grid-cols-2 gap-4">
              {event.participants.map((item) => (
                <div key={item.participant.id}>
                  <strong>{item.member?.firstName} {item.member?.lastName}</strong>
                  <br />
                  <span className="text-sm">
                    {item.participant.role}
                    {item.participant.instrument && ` (${item.participant.instrument})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}