import { RegisterForm } from "./_components/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pb-8 pt-16 sm:py-16">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <Image
              src="/icons/icon-192.png"
              alt="Igreja Central"
              width={48}
              height={48}
              unoptimized
              className="mx-auto mb-2 size-12 rounded-md shadow-xs ring-1 ring-border/40"
            />
            <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
            <CardDescription>
              Preencha os seus dados. Depois de enviar, a liderança da igreja analisa e libera o seu acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/sign-in" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
