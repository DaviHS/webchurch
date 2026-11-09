"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SignInFields } from "./sign-in-fields"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { toastError } from "@/lib/toast";

function destinationAfterLogin(): string {
  const target = new URLSearchParams(window.location.search).get("callbackUrl")
  return target?.startsWith("/") && !target.startsWith("//") ? target : "/app"
}

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const toastId = toast.loading("Validando credenciais...")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        switch (result.error) {
          case "PENDING":
            setError("Seu cadastro está pendente de aprovação. Aguarde a liberação do acesso.")
            toastError("Cadastro pendente de aprovação", { id: toastId })
            break
          case "INVALID_CREDENTIALS":
          case "USER_NOT_FOUND":
            setError("Credenciais inválidas. Por favor, tente novamente.")
            toastError("Credenciais inválidas. Verifique seus dados e tente novamente.", { id: toastId })
            break
          case "REJECTED":
            setError("Seu cadastro não foi aprovado. Fale com a liderança da igreja se achar que houve engano.")
            toastError("Cadastro não aprovado", { id: toastId })
            break
          case "INACTIVE":
            setError("Seu cadastro não está ativo. Entre em contato com o suporte.")
            toastError("Cadastro inativo", { id: toastId })
            break
          default:
            setError(result.error)
            toastError(result.error, { id: toastId })
            break
        }
      } else {
        toast.success("Login realizado com sucesso", { id: toastId })
        
        router.push(destinationAfterLogin())
      }
    } catch {
      setError("Ocorreu um erro ao fazer login. Por favor, tente novamente.")
      toastError("Erro de servidor. Tente novamente mais tarde.", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSupportClick = () => {
    const phoneNumber = "5511967701575"
    const message = "Olá! Preciso de ajuda com o acesso da Igreja Central - Vida com Propósito."
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">Acesso ao sistema</CardTitle>
        <CardDescription>Entre com seu e-mail e senha para acessar o sistema</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <SignInFields
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm">
        <div>
          <span className="text-muted-foreground">Sem acesso ao e-mail? </span>
          <button
            type="button"
            onClick={handleSupportClick}
            className="cursor-pointer text-primary hover:underline"
          >
            Fale com o suporte.
          </button>
        </div>
        <div>
          <span className="text-muted-foreground">Ainda não tem conta? </span>
          <Link href="/register" className="text-primary hover:underline">
            Crie a sua aqui.
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
