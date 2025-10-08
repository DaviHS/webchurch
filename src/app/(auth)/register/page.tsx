import { RegisterForm } from "./_components/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, User2, User2Icon } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User2Icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
            <CardDescription>
              Preencha seus dados para criar sua conta
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