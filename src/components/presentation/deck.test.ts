import { describe, expect, it } from "vitest";
import { passageToDeckSong, plainSlideText, wrapText } from "./deck";

describe("wrapText", () => {
  it("não deixa uma palavra sozinha na última linha", () => {
    const lines = wrapText("⁶ E Deus disse: — Haja um firmamento no meio das águas e separação entre águas e águas.", 40).split("\n");
    expect(lines).toHaveLength(3);
    expect(Math.max(...lines.map((line) => line.length))).toBeLessThanOrEqual(40);
    expect(Math.min(...lines.map((line) => line.length))).toBeGreaterThan(20);
  });

  it("mantém numa linha o texto que cabe", () => {
    expect(wrapText("Jesus chorou.", 40)).toBe("Jesus chorou.");
  });

  it("não perde nem reordena palavras", () => {
    const text = "No princípio criou Deus os céus e a terra e a terra era sem forma e vazia";
    expect(wrapText(text, 40).replace(/\n/g, " ")).toBe(text);
  });

  it("aceita palavra maior que a largura", () => {
    expect(wrapText("abc inconstitucionalissimamente def", 10).split("\n")).toContain("inconstitucionalissimamente");
  });
});

describe("passageToDeckSong", () => {
  const passage = {
    title: "Gênesis 1:6-7",
    bookChapter: "Gênesis 1",
    version: { code: "NAA", name: "Nova Almeida Atualizada" },
    verses: [
      { verse: 6, text: "E Deus disse: — Haja um firmamento no meio das águas e separação entre águas e águas." },
      { verse: 7, text: "E Deus fez o firmamento." },
    ],
  };

  it("usa 1 versículo por slide como padrão", () => {
    const song = passageToDeckSong(passage, "uid");
    expect(song.slides).toHaveLength(2);
    expect(song.slideLabels).toEqual(["Gênesis 1:6", "Gênesis 1:7"]);
  });

  it("mostra a versão só na referência do slide", () => {
    const song = passageToDeckSong(passage, "uid");
    expect(song.title).toBe("Gênesis 1:6-7");
    expect(song.artist).toBeNull();
    expect(plainSlideText(song.slides[0] ?? "")).not.toContain("NAA");
  });
});
