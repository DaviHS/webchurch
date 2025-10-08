"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const form = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = api.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso! Redirecionando...");
      router.refresh(); 
      router.push("/app");
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: ChangePasswordData) => {
    changePasswordMutation.mutate({
      newPassword: data.newPassword,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova Senha</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            {...form.register("newPassword")}
            placeholder="Digite a nova senha"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {form.formState.errors.newPassword && (
          <p className="text-sm text-red-500">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...form.register("confirmPassword")}
            placeholder="Confirme a nova senha"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={changePasswordMutation.isPending}
        className="w-full"
      >
        {changePasswordMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Trocar Senha
      </Button>
    </form>
  );
}