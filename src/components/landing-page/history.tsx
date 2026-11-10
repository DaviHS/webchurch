import type { SiteSettings } from "@/lib/site-settings";

export default function History({ settings }: { settings: SiteSettings }) {
  if (settings.history.length === 0) return null;

  return (
    <section id="historia" className="bg-white py-16 md:py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter text-primary sm:text-4xl md:text-5xl">Nossa História</h2>
          {settings.historyIntro && <p className="max-w-[800px] text-gray-700 md:text-xl">{settings.historyIntro}</p>}
        </div>

        <div className="mx-auto max-w-3xl space-y-8">
          {settings.history.map((item, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-2xl font-bold text-primary">{item.title}</h3>
              <p className="whitespace-pre-line text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
