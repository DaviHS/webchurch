import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookIcon as Bible, Heart, Users } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/site-settings";

const ICONS = [Bible, Heart, Users];

export default function About({ settings }: { settings: SiteSettings }) {
  return (
    <section id="sobre" className="bg-white py-16 md:py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-primary sm:text-4xl md:text-5xl">Sobre Nossa Igreja</h2>
          {settings.aboutIntro && <p className="max-w-[800px] text-gray-700 md:text-xl">{settings.aboutIntro}</p>}
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {settings.aboutCards.map((card, index) => {
            const Icon = ICONS[index] ?? Bible;
            return (
              <Card key={index} className="border-2 border-primary/10">
                <CardContent className="flex flex-col items-center pt-6 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{card.title}</h3>
                  <p className="text-gray-700">{card.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Link href="#historia">
            <Button className="bg-primary hover:bg-primary/90">Saiba Mais Sobre Nós</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
