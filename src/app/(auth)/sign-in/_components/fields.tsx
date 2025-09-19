import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  showPassword: boolean
  onToggleShowPassword: () => void
}

export default function Fields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
}: Props) {
  const router = useRouter()

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Abre WhatsApp com mensagem personalizada
    const phoneNumber = "5511967701575" // Seu número do WhatsApp
    const message = `Olá! Preciso de ajuda para redefinir minha senha do sistema Igreja Central - Vida com Propósito.${email ? ` Meu e-mail é: ${email}` : ''}`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, "_blank")
  }

  return (
    <>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <button 
            onClick={handleForgotPassword}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Esqueceu a senha?
          </button>
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleShowPassword}
            className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  )
}