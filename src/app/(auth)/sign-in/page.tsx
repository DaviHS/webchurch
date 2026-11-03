"use client"

import Link from "next/link"
import Form from "./_components/form"

export default function SignIn() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md mx-auto">
        <Form />
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  )
}
