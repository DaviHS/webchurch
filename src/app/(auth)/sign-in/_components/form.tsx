"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Fields from "./fields"
import { Lock } from "lucide-react"
import { toast } from "sonner"

export default function Form() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
            toast.error("Cadastro pendente de aprovação", { id: toastId })
            break
          case "INVALID_CREDENTIALS":
          case "USER_NOT_FOUND":
            setError("Credenciais inválidas. Por favor, tente novamente.")
            toast.error("Credenciais inválidas. Verifique seus dados e tente novamente.", { id: toastId })
            break
          case "INACTIVE":
            setError("Seu cadastro não está ativo. Entre em contato com o suporte.")
            toast.error("Cadastro inativo", { id: toastId })
            break
          default:
            setError(result.error)
            toast.error(result.error, { id: toastId })
            break
        }
      } else {
        toast.success("Login realizado com sucesso!", { id: toastId })
        
        if (password === "123456") {
          router.push("/change-password")
        } else {
          router.push("/app")
        }
      }
    } catch {
      setError("Ocorreu um erro ao fazer login. Por favor, tente novamente.")
      toast.error("Erro de servidor. Tente novamente mais tarde.", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSupportClick = () => {
    const phoneNumber = "5511967701575"
    const message = "Olá! Preciso de ajuda com o acesso da Igreja Central - Vida com Propósito."
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, "_blank")
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="font-playfair text-2xl">Acesso ao Sistema</CardTitle>
        <p className="text-muted-foreground">Digite a senha para acessar as informações</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Fields
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm">
        <div>
          <span className="text-gray-500">Perdeu o acesso? </span>
          <button 
            onClick={handleSupportClick}
            className="text-primary hover:underline cursor-pointer"
          >
            Fale com o suporte.
          </button>
        </div>
        <div>
          <span className="text-gray-500">Ainda não tem conta? </span>
          <Link href="/register" className="text-primary hover:underline">
            Crie a sua aqui.
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
