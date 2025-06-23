import Link from "next/link"
import { Instagram } from "lucide-react"
import Image from "next/image"
import { mapsUrl } from "@/lib/contants"

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo da Igreja Central"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">Igreja Central</span>
                <span className="text-secondary/90 text-base">Vida Com Propósito</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <a
                href="https://instagram.com/igrejacentralvcp/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#inicio" className="text-white/80 hover:text-secondary">
                  Início
                </Link>
              </li>
              <li>
                <Link href="#sobre" className="text-white/80 hover:text-secondary">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="#cultos" className="text-white/80 hover:text-secondary">
                  Cultos
                </Link>
              </li>
              <li>
                <Link href="#historia" className="text-white/80 hover:text-secondary">
                  História
                </Link>
              </li>
              <li>
                <Link href="#galeria" className="text-white/80 hover:text-secondary">
                  Galeria
                </Link>
              </li>
              <li>
                <Link href="#contato" className="text-white/80 hover:text-secondary">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Horários de Culto</h3>
            <ul className="space-y-2">
              <li className="text-white/80">
                <span className="font-medium">Domingo:</span> 18:00
              </li>
              <li className="text-white/80">
                <span className="font-medium">Quarta-feira:</span> 19:30
              </li>
              <li className="text-white/80">
                <li className="text-white/80">
                  <span className="font-medium">Demais cultos com dias e horários variados.</span> Entre em contato para mais informações.
                </li>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <address className="not-italic space-y-2 text-white/80">
              <a 
                href={mapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <p className="group-hover:text-secondary/90 transition-colors duration-200">
                  Rua Jamil João Zarif, 1408 - Jardim Santa Vicencia
                </p>
                <p className="group-hover:text-secondary/90 transition-colors duration-200">
                  Guarulhos - São Paulo, CEP 07143-000
                </p>
              </a>
              <p>E-mail: Indisponível</p>
            </address>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
          <p>© {new Date().getFullYear()} Igreja Central. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
