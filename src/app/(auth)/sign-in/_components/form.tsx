"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ButtonLoading } from "@/components/ui/button";
import { signInSchema, type SignInSchema } from "@/validators/auth";
import { Fields } from "./fields";

export const SignInForm = () => {
  const { toast, toastError } = useToast();
  const [isPending, startTransaction] = useTransition();
  const router = useRouter();

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      userLogin: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<SignInSchema> = async (d) => {
    startTransaction(async () => {
      const responseAuth = await signIn("credentials", {
        ...d,
        auth_type: "email_auth",
        app_id: "4",
        redirect: false,
      });

      if (responseAuth?.error) {
        return toastError({
          title: "Ocorreu um erro ao tentar se autenticar",
          description: responseAuth.code,
        });
      }

      toast({ title: "Sucesso ao se autenticar!" });
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get("from") || `/app`;
  
      return router.push(from);
    });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
      <Image src={`/ico-ulp.png`} width={64} height={64} alt="ULP ícone" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <Fields />
          <ButtonLoading isLoading={isPending}>Entrar</ButtonLoading>
        </form>
      </Form>
      <p>
        Não possui uma conta entre em contato com o{" "}
        <Link href="#" className="text-muted-foreground">
          Suporte!
        </Link>
      </p>
    </div>
  );
};
