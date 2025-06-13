"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError("Credenciais inválidas. Por favor, tente novamente.")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setError("Ocorreu um erro ao fazer login. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#e6f3ef] p-4 pt-0 sm:pt-4 md:pt-10">
      <div className="w-full max-w-md -mt-20 sm:mt-0 md:mt-10">
        <div className="relative w-80 h-80 mx-auto -mb-20 z-10">
          <Image
            src="/logo.png"
            alt="Logo da Igreja Central"
            fill
            className="object-contain"
            priority
          />
        </div>
        <Card className="relative w-full z-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-primary">Área do Membro</CardTitle>
            <CardDescription className="text-center">Entre com suas credenciais para acessar sua conta</CardDescription>
            <CardDescription className="text-center text-red-800">Em Desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Link href="#" className="text-sm text-primary hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-gray-500">Ainda não tem uma conta? </span>
              <Link href="#" className="text-primary hover:underline">
                Fale com a secretaria
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}