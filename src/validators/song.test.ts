import { describe, expect, it } from "vitest";
import { songFormSchema, songSchema } from "./song";

const base = { title: "Aleluia", category: "praise" as const };

describe("duração no formulário", () => {
  it("é opcional: aceita vazio e ausente", () => {
    expect(songFormSchema.safeParse({ ...base, duration: "" }).success).toBe(true);
    expect(songFormSchema.safeParse(base).success).toBe(true);
  });

  it("aceita mm:ss", () => {
    expect(songFormSchema.safeParse({ ...base, duration: "03:30" }).success).toBe(true);
    expect(songFormSchema.safeParse({ ...base, duration: "3:30" }).success).toBe(true);
  });

  it("recusa formato inválido", () => {
    expect(songFormSchema.safeParse({ ...base, duration: "abc" }).success).toBe(false);
    expect(songFormSchema.safeParse({ ...base, duration: "3:5" }).success).toBe(false);
  });
});

describe("duração no servidor", () => {
  it("converte mm:ss em segundos", () => {
    expect(songSchema.parse({ ...base, duration: "03:30" }).duration).toBe(210);
  });

  it("vazio ou ausente vira 0, que significa buscar a duração", () => {
    expect(songSchema.parse({ ...base, duration: "" }).duration).toBe(0);
    expect(songSchema.parse(base).duration).toBe(0);
  });

  it("aceita número direto", () => {
    expect(songSchema.parse({ ...base, duration: 95 }).duration).toBe(95);
  });
});
