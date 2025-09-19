"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from 'lucide-react'
import { signOut, useSession } from "next-auth/react"
import Image from "next/image"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-primary shadow-md">
      <div className="mx-auto w-full max-w-screen-xl px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-20 h-20">
            <Image
              src="/logo.png"
              alt="Logo da Igreja Central"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-white">Igreja Central</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#inicio" className="text-sm font-medium hover:text-secondary text-white transition-colors">
            Início
          </Link>
          <Link href="#sobre" className="text-sm font-medium hover:text-secondary text-white transition-colors">
            Sobre
          </Link>
          <Link href="#cultos" className="text-sm font-medium hover:text-secondary text-white transition-colors">
            Cultos
          </Link>
          <Link href="#historia" className="text-sm font-medium hover:text-secondary text-white transition-colors">
            História
          </Link>
          <Link href="#galeria" className="text-sm font-medium hover:text-secondary text-white transition-colors">
            Galeria
          </Link>
          <Link href="#contato" className="text-sm font-medium hover:text-secondary text-white transition-colors">
            Contato
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <>
              <Button asChild variant="outline" className="bg-white text-primary hover:bg-white/90">
                <Link href="/app">Área do Membro</Link>
              </Button>
              <Button variant="ghost" onClick={() => void signOut()} className="text-white hover:bg-white/10">
                Sair
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" className="bg-white text-primary hover:bg-white/90">
              <Link href="/app">Área do Membro</Link>
            </Button>
          )}
        </div>

        <button 
          className="block md:hidden p-2" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          {isMenuOpen ? <X className="text-white" /> : <Menu className="text-white" />}
        </button>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-primary shadow-lg md:hidden pb-4">
          <nav className="flex flex-col gap-2 px-4">
            <Link
              href="#inicio"
              className="py-2 text-sm font-medium hover:text-secondary text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              href="#sobre" 
              className="py-2 text-sm font-medium hover:text-secondary text-white transition-colors" 
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link
              href="#cultos"
              className="py-2 text-sm font-medium hover:text-secondary text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Cultos
            </Link>
            <Link
              href="#historia"
              className="py-2 text-sm font-medium hover:text-secondary text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              História
            </Link>
            <Link
              href="#galeria"
              className="py-2 text-sm font-medium hover:text-secondary text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Galeria
            </Link>
            <Link
              href="#contato"
              className="py-2 text-sm font-medium hover:text-secondary text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contato
            </Link>
            <div className="mt-2 flex flex-col gap-2">
              {session ? (
                <>
                  <Button asChild variant="outline" className="bg-white text-primary hover:bg-white/90">
                    <Link href="/" onClick={() => setIsMenuOpen(false)}>
                      Área do Membro
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => void signOut()} 
                    className="text-white hover:bg-white/10"
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    Área do Membro
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}