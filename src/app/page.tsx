"use client";

import { Hero, About, Services, History, Gallery, Contact, Footer, Navbar } from "@/components/landingPage";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Navbar sempre no topo */}
      <Navbar />

      {/* Conteúdo principal com padding-top para não sobrepor o Navbar */}
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
