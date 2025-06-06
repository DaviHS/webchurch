"use client";

import { About, Hero, Services, History, Gallery, Contact, Footer, Navbar } from "@/components/landingPage";
import { PageContent } from "@/components/page";

export const Body = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Services />
      <History />
      <Gallery />
      <Contact />
      <Footer />
    </>
  );
};
