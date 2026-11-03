import { type Metadata, type Viewport } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - Igreja Central",
    default: "Web - Igreja Central",
    absolute: "Igreja Central - Vida com Propósito",
  },
  description: "Igreja Central - Vida com Propósito",
  applicationName: "Igreja Central",
  appleWebApp: {
    capable: true,
    title: "Igreja Central",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003F2D" },
    { media: "(prefers-color-scheme: dark)", color: "#002318" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
