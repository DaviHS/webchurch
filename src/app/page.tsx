import { Hero, About, Services, History, Gallery, Contact, Footer, Navbar } from "@/components/landing-page";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <div className="light relative bg-background text-foreground">
      <Navbar name={settings.name} showServices={settings.services.length > 0} showHistory={settings.history.length > 0} showGallery={settings.galleryImages.length > 0} />

      <main className="pt-16">
        <Hero settings={settings} />
        <About settings={settings} />
        <Services settings={settings} />
        <History settings={settings} />
        <Gallery settings={settings} />
        <Contact settings={settings} />
        <Footer settings={settings} />
      </main>
    </div>
  );
}
