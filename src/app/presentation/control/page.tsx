"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { DeckRequest } from "@/components/presentation/control/control-console";

const ControlConsole = dynamic(
  () => import("@/components/presentation/control/control-console").then((mod) => mod.ControlConsole),
  { ssr: false }
);

function parseId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

function ControlPageContent() {
  const params = useSearchParams();
  const eventId = parseId(params.get("event"));
  const songId = parseId(params.get("song"));
  const request: DeckRequest | null = eventId ? { eventId } : songId ? { songId } : null;

  if (!request) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p>Escolha um evento para apresentar.</p>
        <Button asChild>
          <Link href="/app/praise/events">Ir para eventos</Link>
        </Button>
      </div>
    );
  }

  return <ControlConsole request={request} />;
}

export default function PresentationControlPage() {
  return (
    <Suspense>
      <ControlPageContent />
    </Suspense>
  );
}
