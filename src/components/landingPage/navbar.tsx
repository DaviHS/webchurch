"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from 'lucide-react'
import Logo from "./logo"
import { signIn, signOut, useSession } from "next-auth/react"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-10 w-auto" />
          <span className="text-xl font-bold text-primary">Igreja Central</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="#inicio" className="text-sm font-medium hover:text-primary">
            Início
          </Link>
          <Link href="#sobre" className="text-sm font-medium hover:text-primary">
            Sobre
          </Link>
          <Link href="#cultos" className="text-sm font-medium hover:text-primary">
            Cultos
          </Link>
          <Link href="#historia" className="text-sm font-medium hover:text-primary">
            História
          </Link>
          <Link href="#galeria" className="text-sm font-medium hover:text-primary">
            Galeria
          </Link>
          <Link href="#contato" className="text-sm font-medium hover:text-primary">
            Contato
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">Área do Membro</Link>
              </Button>
              <Button variant="ghost" onClick={() => void signOut()}>
                Sair
              </Button>
            </>
          ) : (
            <Button asChild variant="outline">
              <Link href="/sign-in">Área do Membro</Link>
            </Button>
          )}
        </div>

        <button className="block md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="container md:hidden py-4 bg-white">
          <nav className="flex flex-col gap-4">
            <Link
              href="#inicio"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link href="#sobre" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              Sobre
            </Link>
            <Link
              href="#cultos"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Cultos
            </Link>
            <Link
              href="#historia"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              História
            </Link>
            <Link
              href="#galeria"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Galeria
            </Link>
            <Link
              href="#contato"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Contato
            </Link>
            {session ? (
              <>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    Área do Membro
                  </Link>
                </Button>
                <Button variant="ghost" onClick={() => void signOut()} className="mt-2">
                  Sair
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" className="mt-2">
                <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                  Área do Membro
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}