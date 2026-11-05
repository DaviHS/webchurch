"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { api } from "@/trpc/react";

const schema = z
  .object({
    newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { newPassword: "", confirmPassword: "" } });

  const confirm = api.passwordReset.confirm.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada. Entre com a nova senha.");
      router.push("/sign-in");
    },
  });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((data) => confirm.mutate({ token, newPassword: data.newPassword }))}>
      {confirm.error && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {confirm.error.message}{" "}
          {confirm.error.data?.code === "BAD_REQUEST" && (
            <Link href="/forgot-password" className="underline">
              Pedir novo link
            </Link>
          )}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <PasswordInput id="newPassword" autoComplete="new-password" {...form.register("newPassword")} />
        {form.formState.errors.newPassword && <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
        {form.formState.errors.confirmPassword && <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={confirm.isPending}>
        {confirm.isPending && <Loader2 className="animate-spin" />}
        {confirm.isPending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
