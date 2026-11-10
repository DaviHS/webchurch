"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  name: string;
  showServices: boolean;
  showHistory: boolean;
  showGallery: boolean;
}

export default function Navbar({ name, showServices, showHistory, showGallery }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  const links = [
    { href: "#inicio", label: "Início" },
    { href: "#sobre", label: "Sobre" },
    ...(showServices ? [{ href: "#cultos", label: "Cultos" }] : []),
    ...(showHistory ? [{ href: "#historia", label: "História" }] : []),
    ...(showGallery ? [{ href: "#galeria", label: "Galeria" }] : []),
    { href: "#contato", label: "Contato" },
  ];

  const memberArea = (onClick?: () => void) => (
    <>
      <Button asChild variant="outline" className="bg-white text-primary hover:bg-white/90">
        <Link href="/app" onClick={onClick}>
          Área do Membro
        </Link>
      </Button>
      {session && (
        <Button variant="ghost" onClick={() => void signOut()} className="text-white hover:bg-white/10">
          Sair
        </Button>
      )}
    </>
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full border-b bg-primary shadow-md">
      <div className="mx-auto flex h-16 w-full max-w-(--breakpoint-xl) items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="relative h-20 w-20">
            <Image src="/logo.png" alt={`Logo da ${name}`} fill className="object-contain" priority />
          </div>
          <span className="text-xl font-bold text-white">{name}</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-white transition-colors hover:text-secondary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">{memberArea()}</div>

        <button className="block p-2 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
          {isMenuOpen ? <X className="text-white" /> : <Menu className="text-white" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute left-0 right-0 top-16 bg-primary pb-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-2 px-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-sm font-medium text-white transition-colors hover:text-secondary"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">{memberArea(() => setIsMenuOpen(false))}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
