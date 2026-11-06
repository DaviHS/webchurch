"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { toastError } from "@/lib/toast";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const form = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = api.user.changePassword.useMutation({
    onSuccess: async () => {
      toast.success("Senha alterada com sucesso. Redirecionando…");
      await updateSession();
      router.replace("/app");
    },
    onError: (error) => {
      toastError(`Erro ao trocar senha: ${error.message}`);
    },
  });

  const handleSubmit = (data: ChangePasswordData) => {
    changePasswordMutation.mutate({
      newPassword: data.newPassword,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          enterKeyHint="next"
          {...form.register("newPassword")}
          placeholder="Digite a nova senha"
          aria-invalid={!!form.formState.errors.newPassword}
        />
        {form.formState.errors.newPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          enterKeyHint="done"
          {...form.register("confirmPassword")}
          placeholder="Confirme a nova senha"
          aria-invalid={!!form.formState.errors.confirmPassword}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={changePasswordMutation.isPending}
        className="w-full"
      >
        {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Trocar senha
      </Button>
    </form>
  );
}
