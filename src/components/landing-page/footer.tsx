import Link from "next/link";
import Image from "next/image";
import { Instagram } from "@/components/icons/brand";
import { mapsLink, type SiteSettings } from "@/lib/site-settings";

const QUICK_LINKS = [
  { href: "#inicio", label: "Início" },
  { href: "#sobre", label: "Sobre" },
  { href: "#cultos", label: "Cultos" },
  { href: "#historia", label: "História" },
  { href: "#galeria", label: "Galeria" },
  { href: "#contato", label: "Contato" },
];

export default function Footer({ settings }: { settings: SiteSettings }) {
  const links = QUICK_LINKS.filter(
    (link) =>
      (link.href !== "#cultos" || settings.services.length > 0) &&
      (link.href !== "#historia" || settings.history.length > 0) &&
      (link.href !== "#galeria" || settings.galleryImages.length > 0),
  );

  return (
    <footer className="bg-primary py-12 text-white">
      <div className="container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0">
                <Image src="/logo.png" alt={`Logo da ${settings.name}`} fill className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">{settings.name}</span>
                {settings.tagline && <span className="text-base text-secondary/90">{settings.tagline}</span>}
              </div>
            </div>

            {settings.instagram && (
              <div className="flex space-x-4">
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-secondary">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Links Rápidos</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/80 hover:text-secondary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {settings.services.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold">Horários de Culto</h3>
              <ul className="space-y-2">
                {settings.services.map((service, index) => (
                  <li key={index} className="text-white/80">
                    <span className="font-medium">{service.title}:</span> {[service.day, service.time].filter(Boolean).join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-lg font-bold">Contato</h3>
            <address className="space-y-2 not-italic text-white/80">
              {(settings.street || settings.city) && (
                <a href={mapsLink(settings)} target="_blank" rel="noopener noreferrer" className="group block">
                  {settings.street && <p className="transition-colors duration-200 group-hover:text-secondary/90">{settings.street}</p>}
                  {settings.city && <p className="transition-colors duration-200 group-hover:text-secondary/90">{settings.city}</p>}
                </a>
              )}
              {settings.email && (
                <p>
                  E-mail:{" "}
                  <a href={`mailto:${settings.email}`} className="hover:text-secondary">
                    {settings.email}
                  </a>
                </p>
              )}
            </address>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-8 text-center text-white/70">
          <p>
            © {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
