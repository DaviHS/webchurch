import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_ID, PROJECTION_THEMES, themeById } from "./themes";

describe("themeById", () => {
  it("devolve o tema pedido", () => {
    expect(themeById("night").id).toBe("night");
  });

  it("volta ao tema padrão para valores desconhecidos ou vazios", () => {
    expect(themeById("inexistente").id).toBe(DEFAULT_THEME_ID);
    expect(themeById(null).id).toBe(DEFAULT_THEME_ID);
    expect(themeById(undefined).id).toBe(DEFAULT_THEME_ID);
  });

  it("não repete ids", () => {
    const ids = PROJECTION_THEMES.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
