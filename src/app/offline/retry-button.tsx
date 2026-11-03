"use client";

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      style={{
        marginTop: "0.5rem",
        padding: "0.625rem 1.25rem",
        borderRadius: 8,
        border: "none",
        background: "#003F2D",
        color: "#ffffff",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Tentar novamente
    </button>
  );
}
