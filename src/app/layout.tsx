import { type PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { fontSans } from "@/config/fonts";
import { ThemeProvider } from "@/components/ui/theme-provider"
import { PageProvider } from "@/contexts/page-context";

export * from "./__metadata";

import "@/styles/globals.css";

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="pt-BR" className={`${fontSans.className}`}>
      <body>
        <TRPCReactProvider>
          <SessionProvider>
            <ThemeProvider 
              attribute="class" 
              defaultTheme="light" 
              enableSystem 
              disableTransitionOnChange
            >
              <PageProvider>
                {children}
              </PageProvider>
            </ThemeProvider>
          </SessionProvider>
        </TRPCReactProvider>
        <Sonner />
        <Toaster />
      </body>
    </html>
  );
}
