"use client"

import type React from "react"
import type { PropsWithChildren } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "./ui/button"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib"
import imageError from "@/assets/imagens/error.png"

const ErrorComponent = () => {
  return (
    <PageContent className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
      <AnimatePresence>
        <motion.div
          className="relative h-92 w-80 sm:h-80 sm:w-80"
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
        >
          <Image src={imageError} alt="Erro na aplicação" fill priority className="object-contain"/>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="space-y-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="text-center font-bold">Oops! Ocorreu um erro!</p>
        <p className="text-lg text-muted-foreground">
          Se o mesmo persistir entre em contato com o <span className="font-bold">Suporte</span>.
        </p>
        <Button asChild>
          <Link href="/app">Voltar para a tela inicial</Link>
        </Button>
      </motion.div>
    </PageContent>
  )
}

interface PageContentProps extends Readonly<PropsWithChildren<React.ComponentProps<"div">>> {
  isLoading?: boolean
}

const PageContent = ({ children, isLoading, className, ref }: PageContentProps) => {
  return (
    <ErrorBoundary
      fallback={<ErrorComponent />}
      onError={(error) => console.error("Erro capturado no PageContent:", error)}
    >
      <main ref={ref} className={cn("w-full space-y-4 p-4 md:p-6", className)}>
        {isLoading ? <h1>Carregando...</h1> : children}
      </main>
    </ErrorBoundary>
  )
}

export { PageContent }
