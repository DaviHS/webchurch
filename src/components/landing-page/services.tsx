import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";

export default function Services({ settings }: { settings: SiteSettings }) {
  if (settings.services.length === 0) return null;

  return (
    <section id="cultos" className="bg-gray-50 py-16 md:py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-primary sm:text-4xl md:text-5xl">Nossos Cultos</h2>
          <p className="max-w-[800px] text-gray-700 md:text-xl">
            Venha participar de nossos cultos e atividades semanais. Temos programações para todas as idades e momentos especiais de adoração e comunhão.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {settings.services.map((service, index) => (
            <Card key={index} className="border-2 border-primary/10">
              <CardContent className="pt-6">
                <h3 className="mb-4 text-xl font-bold text-primary">{service.title}</h3>
                <div className="space-y-3">
                  {service.day && (
                    <div className="flex items-center">
                      <Calendar className="mr-3 h-5 w-5 shrink-0 text-primary" />
                      <span>{service.day}</span>
                    </div>
                  )}
                  {service.time && (
                    <div className="flex items-center">
                      <Clock className="mr-3 h-5 w-5 shrink-0 text-primary" />
                      <span>{service.time}</span>
                    </div>
                  )}
                  {service.place && (
                    <div className="flex items-center">
                      <MapPin className="mr-3 h-5 w-5 shrink-0 text-primary" />
                      <span>{service.place}</span>
                    </div>
                  )}
                </div>
                {service.description && <p className="mt-4 text-gray-700">{service.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
