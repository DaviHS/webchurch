import { type PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { fontSans } from "@/config/fonts";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export * from "./__metadata";

import "@/styles/globals.css";

export default function RootLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="pt-BR" className={fontSans.className} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              {children}
              <Toaster />
              <ServiceWorkerRegister />
            </ThemeProvider>
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
