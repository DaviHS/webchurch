"use client"

import Form from "./_components/form"

export default function SignIn() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-md mx-auto">
        <Form />
      </div>

      <div className="mt-6 text-center">
        <a href="/" className="text-sm text-primary hover:underline">
          ← Voltar para a página inicial
        </a>
      </div>
    </div>
  )
}
