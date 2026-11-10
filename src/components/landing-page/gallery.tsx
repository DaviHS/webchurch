import Image from "next/image";
import type { SiteSettings } from "@/lib/site-settings";

export default function Gallery({ settings }: { settings: SiteSettings }) {
  if (settings.galleryImages.length === 0) return null;

  return (
    <section id="galeria" className="bg-gray-50 py-16 md:py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-primary sm:text-4xl md:text-5xl">Galeria</h2>
          <p className="max-w-[800px] text-gray-700 md:text-xl">Momentos especiais de nossa comunidade em cultos, eventos e atividades.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {settings.galleryImages.map((src, index) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={src}
                alt={`Foto da igreja ${index + 1}`}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
