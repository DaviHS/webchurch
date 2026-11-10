import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/site-settings";

export default function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section id="inicio" className="relative bg-primary py-20 md:py-32">
      <div className="container flex flex-col items-center text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">{settings.heroTitle}</h1>
          {settings.heroSubtitle && <p className="text-xl text-white/90 md:text-2xl">{settings.heroSubtitle}</p>}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {settings.services.length > 0 && (
              <Link href="#cultos">
                <Button size="lg" className="bg-secondary text-primary hover:bg-secondary/90">
                  Nossos Cultos
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="#historia">
              <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10">
                Conheça Nossa História
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
