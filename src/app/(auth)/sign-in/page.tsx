import Link from "next/link"
import { SignInForm } from "./_components/sign-in-form"

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md mx-auto">
        <SignInForm />
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  )
}
