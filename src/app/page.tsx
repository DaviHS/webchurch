"use client";

import { Hero, About, Services, History, Gallery, Contact, Footer, Navbar } from "@/components/landing-page";

export default function HomePage() {
  return (
    <div className="light relative bg-background text-foreground">
      <Navbar />

      <main className="pt-16">
        <Hero />
        <About />
        <Services />
        <History />
        <Gallery />
        <Contact />
        <Footer />
      </main>
    </div>
  );
}
