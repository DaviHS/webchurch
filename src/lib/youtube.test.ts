import { describe, expect, it } from "vitest";
import { pickBestVideo } from "./youtube";

const item = (videoId: string, title: string, channelTitle = "") => ({ id: { videoId }, snippet: { title, channelTitle } });

describe("pickBestVideo", () => {
  it("escolhe o vídeo cujo título e artista batem", () => {
    const best = pickBestVideo(
      [item("a", "Outra música qualquer", "Canal X"), item("b", "Quão Grande é o Meu Deus - Chris Tomlin (Ao Vivo)", "Chris Tomlin")],
      "Quão grande é o meu Deus",
      "Chris Tomlin",
    );
    expect(best).toBe("b");
  });

  it("ignora vídeos que quase não têm as palavras do título", () => {
    expect(pickBestVideo([item("a", "Receita de bolo")], "Quão grande é o meu Deus", null)).toBeNull();
  });

  it("penaliza playback e karaokê", () => {
    const best = pickBestVideo([item("a", "Aleluia playback karaoke"), item("b", "Aleluia")], "Aleluia", null);
    expect(best).toBe("b");
  });

  it("ignora itens sem id de vídeo e lista vazia", () => {
    expect(pickBestVideo([{ snippet: { title: "Aleluia" } }], "Aleluia", null)).toBeNull();
    expect(pickBestVideo([], "Aleluia", null)).toBeNull();
  });

  it("ignora acentos ao comparar", () => {
    expect(pickBestVideo([item("a", "Poderoso Deus")], "Poderoso Déus", null)).toBe("a");
  });
});
