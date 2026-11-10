import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Instagram } from "@/components/icons/brand";
import { mapsEmbedLink, mapsLink, whatsappLink, type SiteSettings } from "@/lib/site-settings";

export default function Contact({ settings }: { settings: SiteSettings }) {
  const whatsapp = whatsappLink(settings.whatsapp);
  const hasAddress = Boolean(settings.street || settings.city);

  return (
    <section id="contato" className="bg-white py-16 md:py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-primary sm:text-4xl md:text-5xl">Entre em Contato</h2>
          <p className="max-w-[800px] text-gray-700 md:text-xl">Estamos à disposição para responder suas dúvidas e receber seu contato.</p>
        </div>

        <div className="mx-auto max-w-2xl space-y-8">
          {(whatsapp !== null || settings.email !== "") && (
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              {whatsapp && (
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Falar no WhatsApp
                  </a>
                </Button>
              )}
              {settings.email && (
                <Button asChild size="lg" variant="outline">
                  <a href={`mailto:${settings.email}`}>
                    <Mail className="mr-2 h-5 w-5" />
                    Enviar e-mail
                  </a>
                </Button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {hasAddress && (
              <div className="flex items-start">
                <MapPin className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Endereço</p>
                  <a href={mapsLink(settings)} target="_blank" rel="noopener noreferrer" className="group">
                    {settings.street && <p className="text-gray-700 transition-colors duration-200 group-hover:text-primary">{settings.street}</p>}
                    {settings.city && <p className="text-gray-700 transition-colors duration-200 group-hover:text-primary">{settings.city}</p>}
                    <p className="text-sm font-medium text-primary">Como chegar</p>
                  </a>
                </div>
              </div>
            )}

            {settings.email && (
              <div className="flex items-start">
                <Mail className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">E-mail</p>
                  <a href={`mailto:${settings.email}`} className="text-gray-700 hover:text-primary">
                    {settings.email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {hasAddress && (
            <iframe
              title={`Mapa: ${settings.street}`}
              src={mapsEmbedLink(settings)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full rounded-lg border-0 sm:h-96"
            />
          )}

          {settings.instagram && (
            <div>
              <h3 className="mb-4 text-2xl font-bold text-primary">Redes Sociais</h3>
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full bg-primary p-3 text-white hover:bg-primary/90"
              >
                <Instagram className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
