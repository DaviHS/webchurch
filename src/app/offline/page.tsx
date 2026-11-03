import type { Metadata } from "next";
import Image from "next/image";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = {
  title: "Sem conexão",
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background: "#ffffff",
        color: "#003F2D",
      }}
    >
      <Image src="/icons/icon-192.png" alt="" width={96} height={96} unoptimized style={{ borderRadius: 20 }} />
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Você está sem conexão</h1>
      <p style={{ maxWidth: 360, margin: 0, color: "#4b5563", lineHeight: 1.5 }}>
        Não foi possível carregar esta página. Verifique sua internet e tente novamente.
      </p>
      <RetryButton />
    </main>
  );
}
