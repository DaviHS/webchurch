import { describe, expect, it } from "vitest";
import { baseTitle, fold, normalizeText, normalizeTitle, stripAccents } from "./text";
import { songKey } from "./song-key";

describe("normalizeText", () => {
  it("tira acento, caixa e símbolos", () => {
    expect(normalizeText("  Ação  &  Fé!  ")).toBe("acao fe");
  });

  it("aceita vazio, nulo e indefinido", () => {
    expect(normalizeText("")).toBe("");
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });

  it("mantém letras de outros alfabetos", () => {
    expect(normalizeText("Κύριε, ελέησον")).toBe("κυριε ελεησον");
  });
});

describe("fold e stripAccents", () => {
  it("fold só tira acento e põe em minúsculas, sem mexer na pontuação", () => {
    expect(fold("Você, Senhor!")).toBe("voce, senhor!");
  });

  it("stripAccents mantém a caixa", () => {
    expect(stripAccents("Ação")).toBe("Acao");
  });
});

describe("normalizeTitle e baseTitle", () => {
  it("ignora artigo no começo", () => {
    expect(normalizeTitle("O Senhor é meu pastor")).toBe("senhor e meu pastor");
    expect(normalizeTitle("As Muralhas")).toBe("muralhas");
  });

  it("não tira artigo no meio nem palavras que só começam igual", () => {
    expect(normalizeTitle("Ao Senhor")).toBe("ao senhor");
    expect(normalizeTitle("Alegria")).toBe("alegria");
  });

  it("baseTitle ignora o que vem entre parênteses ou depois de hífen", () => {
    expect(baseTitle("Que Ele Cresça - Ao Vivo")).toBe("que ele cresca");
    expect(baseTitle("Que Ele Cresça (Ao Vivo)")).toBe("que ele cresca");
    expect(baseTitle("Que Ele Cresça [Remix]")).toBe("que ele cresca");
  });
});

describe("songKey", () => {
  it("considera iguais títulos que só diferem em acento, caixa e pontuação", () => {
    expect(songKey("Quão Grande é o Meu Deus", "Chris Tomlin")).toBe(songKey("quao grande e o meu deus!", "chris tomlin"));
  });

  it("separa músicas de artistas diferentes", () => {
    expect(songKey("Aleluia", "A")).not.toBe(songKey("Aleluia", "B"));
  });

  it("trata artista ausente como vazio", () => {
    expect(songKey("Aleluia", null)).toBe(songKey("Aleluia", undefined));
    expect(songKey("Aleluia", null)).toBe(songKey("Aleluia", ""));
  });
});
