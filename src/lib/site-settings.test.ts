import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_SETTINGS, mapsEmbedLink, mapsLink, siteSettingsSchema, whatsappLink } from "./site-settings";

describe("configurações do site", () => {
  it("os valores padrão são válidos", () => {
    expect(siteSettingsSchema.safeParse(DEFAULT_SITE_SETTINGS).success).toBe(true);
  });

  it("exige o nome da igreja", () => {
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, name: "  " }).success).toBe(false);
  });

  it("aceita e-mail e Instagram vazios, mas recusa inválidos", () => {
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, email: "", instagram: "" }).success).toBe(true);
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, email: "sem-arroba" }).success).toBe(false);
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, instagram: "não é link" }).success).toBe(false);
  });

  it("limita a galeria a 12 fotos", () => {
    const photos = Array.from({ length: 13 }, (_, index) => `https://exemplo.com/${index}.jpg`);
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, galleryImages: photos }).success).toBe(false);
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, galleryImages: photos.slice(0, 12) }).success).toBe(true);
  });

  it("exige exatamente 3 destaques em Sobre", () => {
    expect(siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, aboutCards: [] }).success).toBe(false);
  });
});

describe("links do site", () => {
  const address = { street: "Rua A, 10", city: "Guarulhos - SP" };

  it("monta o link de rota e o mapa com o endereço codificado", () => {
    expect(mapsLink(address)).toBe("https://www.google.com/maps/dir/?api=1&destination=Rua%20A%2C%2010%2C%20Guarulhos%20-%20SP");
    expect(mapsEmbedLink(address)).toContain("output=embed");
    expect(mapsEmbedLink(address)).toContain(encodeURIComponent("Rua A, 10, Guarulhos - SP"));
  });

  it("whatsappLink acrescenta o 55 em números brasileiros", () => {
    expect(whatsappLink("(11) 91234-5678")).toBe("https://wa.me/5511912345678");
    expect(whatsappLink("5511912345678")).toBe("https://wa.me/5511912345678");
  });

  it("whatsappLink devolve nulo para número curto ou vazio", () => {
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink("123")).toBeNull();
  });
});
