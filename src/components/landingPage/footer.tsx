import Link from "next/link"
import Logo from "./logo"
import { Facebook, Instagram, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo className="h-10 w-auto bg-white rounded-md p-1" />
              <span className="text-xl font-bold">Igreja Central</span>
            </div>
            <p className="text-white/80">Um lugar de fé, comunhão e crescimento espiritual para toda a família.</p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
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
                <span className="font-medium">Domingo:</span> 10:00 e 18:00
              </li>
              <li className="text-white/80">
                <span className="font-medium">Quarta-feira:</span> 19:30
              </li>
              <li className="text-white/80">
                <span className="font-medium">Sexta-feira:</span> 19:30
              </li>
              <li className="text-white/80">
                <span className="font-medium">Sábado:</span> 19:00 (Jovens)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <address className="not-italic space-y-2 text-white/80">
              <p>Av. Principal, 1000 - Centro</p>
              <p>Sua Cidade - Estado, CEP 00000-000</p>
              <p>Telefone: (00) 1234-5678</p>
              <p>E-mail: contato@igrejacentral.com</p>
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
