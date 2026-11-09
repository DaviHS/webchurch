"use client";

import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { whatsappNumber } from "@/lib/birthdays";
import { toastError } from "@/lib/toast";

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  /** Nome para a mensagem do WhatsApp. */
  name: string;
  /** Telefone (de preferência o do WhatsApp) para abrir a conversa já com a pessoa. */
  phone?: string | null;
}

/** Mostra o link para a pessoa criar a própria senha, com atalhos para copiar e mandar pelo WhatsApp. */
export function InviteLinkDialog({ open, onOpenChange, url, name, phone }: InviteLinkDialogProps) {
  const number = whatsappNumber(phone);
  const message = `Olá, ${name}! Seu acesso ao sistema da Igreja Central foi criado. Crie a sua senha por este link (vale por 7 dias e só pode ser usado uma vez): ${url ?? ""}`;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toastError("Não foi possível copiar. Selecione o link e copie à mão.");
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Link para criar a senha</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Envie este link para {name}. Ela define a própria senha e já pode entrar. O link vale por 7 dias e só funciona uma vez.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-3 pb-4">
          <Input value={url ?? ""} readOnly onFocus={(event) => event.currentTarget.select()} aria-label="Link para criar a senha" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={() => void copy()}>
              <Copy className="mr-2 size-4" /> Copiar link
            </Button>
            {number && url && (
              <Button asChild className="flex-1">
                <a href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 size-4" /> Enviar pelo WhatsApp
                </a>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Quem recebe o link consegue criar a senha dessa conta. Mande só para a própria pessoa.</p>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Concluir
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
