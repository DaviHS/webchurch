import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Igreja Central - Vida com Propósito",
    short_name: "Igreja Central",
    description: "Gestão de membros, ministérios, louvor e finanças da Igreja Central.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/entrada",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#003F2D",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Eventos", url: "/app/praise/events", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Músicas", url: "/app/praise/songs", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Membros", url: "/app/admin/members", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
