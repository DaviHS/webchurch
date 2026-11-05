"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const request = api.passwordReset.request.useMutation();

  if (request.isSuccess) {
    return (
      <div role="status" className="space-y-2 rounded-md border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Pedido recebido.</p>
        <p className="text-muted-foreground">
          Se houver um cadastro ativo com esse e-mail, você receberá em instantes um link para criar uma nova senha. Ele vale por 1 hora.
          Confira também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        request.mutate({ email });
      }}
    >
      {request.error && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Não foi possível enviar o pedido. Confira o e-mail e tente novamente.
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={request.isPending || email.trim().length === 0}>
        {request.isPending && <Loader2 className="animate-spin" />}
        {request.isPending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
