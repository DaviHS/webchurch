export const PROJECTION_THEMES = [
  {
    id: "church",
    label: "Verde",
    background: "radial-gradient(ellipse at center, #0a5a42 0%, #003F2D 55%, #00261b 100%)",
    text: "#ffffff",
    shadow: "0 0.06em 0.18em rgb(0 0 0 / 0.55)",
  },
  {
    id: "night",
    label: "Azul",
    background: "radial-gradient(ellipse at center, #1e3a8a 0%, #0f1f4d 55%, #070d26 100%)",
    text: "#ffffff",
    shadow: "0 0.06em 0.18em rgb(0 0 0 / 0.55)",
  },
  {
    id: "graphite",
    label: "Grafite",
    background: "radial-gradient(ellipse at center, #3f3f46 0%, #27272a 55%, #18181b 100%)",
    text: "#ffffff",
    shadow: "0 0.06em 0.18em rgb(0 0 0 / 0.55)",
  },
  {
    id: "wine",
    label: "Vinho",
    background: "radial-gradient(ellipse at center, #7f1d3a 0%, #5a1228 55%, #330a17 100%)",
    text: "#ffffff",
    shadow: "0 0.06em 0.18em rgb(0 0 0 / 0.55)",
  },
] as const;

export type ProjectionThemeId = (typeof PROJECTION_THEMES)[number]["id"];
export type ProjectionTheme = (typeof PROJECTION_THEMES)[number];

export const THEME_IDS = PROJECTION_THEMES.map((theme) => theme.id) as [ProjectionThemeId, ...ProjectionThemeId[]];

export const DEFAULT_THEME_ID: ProjectionThemeId = "church";

export function themeById(id: string | null | undefined): ProjectionTheme {
  return PROJECTION_THEMES.find((theme) => theme.id === id) ?? PROJECTION_THEMES[0];
}
