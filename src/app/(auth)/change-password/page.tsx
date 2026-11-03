import { ChangePasswordForm } from "./_components/change-password-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Key } from "lucide-react";
import Link from "next/link";

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Trocar senha</CardTitle>
            <CardDescription>
              Sua senha atual é a padrão. Por favor, defina uma nova senha pessoal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-sm">
            <div>
              <Link href="/sign-in" className="text-primary hover:underline">
                Voltar para o login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}