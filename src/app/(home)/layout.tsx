import { type PropsWithChildren } from "react";
import { Navbar } from "@/components/landingPage";

const AppLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="relative">
      <Navbar/>
      <main className="pt-16"> {/* Adiciona padding-top igual à altura do navbar */}
        {children}
      </main>
    </div>
  )
};

export default AppLayout;