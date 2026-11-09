"use client";

import { Copy, Loader2, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { toastError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RemoteHost } from "../use-remote-host";

interface RemoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  host: RemoteHost;
  now: number;
}

function sinceLabel(now: number, at: number | null): string {
  if (at === null || now === 0) return "Nenhum comando recebido ainda";
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  return seconds < 2 ? "Último comando agora há pouco" : `Último comando há ${seconds}s`;
}

export function RemoteDialog({ open, onOpenChange, host, now }: RemoteDialogProps) {
  const url = host.code ? `${window.location.origin}/presentation/remote?code=${host.code}` : null;

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copiado"))
      .catch(() => toastError("Não foi possível copiar o link."));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="size-5" /> Controle remoto
          </DialogTitle>
          <DialogDescription>
            Use o celular para passar os slides. Esta tela precisa continuar aberta neste computador.
          </DialogDescription>
        </DialogHeader>

        {host.code && url ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-md border bg-white p-3">
                <QRCodeSVG value={url} size={176} />
              </div>
              <p className="text-xs text-muted-foreground">Aponte a câmera do celular ou digite o código:</p>
              <p className="text-4xl font-bold tracking-[0.3em] tabular-nums">{host.code}</p>
            </div>
            <p className="break-all rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">{url}</p>
            <p className="text-center text-xs text-muted-foreground">{sinceLabel(now, host.lastCommandAt)}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => void copy()}>
                <Copy /> Copiar link
              </Button>
              <Button type="button" variant="destructive" onClick={host.stop}>
                Encerrar
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" className="w-full" disabled={host.starting} onClick={() => void host.start()}>
            {host.starting ? <Loader2 className="animate-spin" /> : <Smartphone />}
            Ativar controle remoto
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
