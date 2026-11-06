"use client";

import { useEffect } from "react";

// Entra no lugar do layout raiz, então precisa trazer o próprio <html> e estilos mínimos.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
          background: "#fff",
          color: "#111",
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Algo deu errado</h1>
          <p style={{ fontSize: 14, color: "#555", margin: "0 0 16px" }}>
            O sistema não conseguiu carregar. Tente de novo; se continuar, avise o setor de desenvolvimento.
          </p>
          <button
            onClick={() => retry()}
            style={{ padding: "10px 16px", borderRadius: 6, border: 0, background: "#111", color: "#fff", fontSize: 14 }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
