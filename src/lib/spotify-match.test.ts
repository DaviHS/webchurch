import { describe, expect, it } from "vitest";
import { matchTracksToCatalog, type CatalogSong } from "./spotify-match";

const catalog: CatalogSong[] = [
  { id: 1, title: "Que Ele Cresça", artist: "Nívea Soares", trackId: "t1" },
  { id: 2, title: "Aleluia", artist: "Gabriela Rocha", trackId: null },
  { id: 3, title: "Aleluia", artist: "Aline Barros", trackId: null },
];

const track = (id: string, name: string, artist = "") => ({ id, name, artist });

describe("matchTracksToCatalog", () => {
  it("reconhece a mesma faixa pelo id do Spotify", () => {
    const [item] = matchTracksToCatalog([track("t1", "Qualquer nome")], catalog);
    expect(item).toMatchObject({ status: "match", songId: 1, songTitle: "Que Ele Cresça" });
  });

  it("reconhece outra gravação pelo título, ignorando sufixos", () => {
    const [item] = matchTracksToCatalog([track("x9", "Que Ele Cresça - Ao Vivo", "Nívea Soares")], catalog);
    expect(item).toMatchObject({ status: "version", songId: 1 });
  });

  it("entre títulos iguais, prefere o artista parecido", () => {
    const [item] = matchTracksToCatalog([track("x1", "Aleluia", "Aline Barros")], catalog);
    expect(item).toMatchObject({ status: "version", songId: 3 });
  });

  it("sem artista parecido, usa o primeiro título igual", () => {
    const [item] = matchTracksToCatalog([track("x2", "Aleluia", "Outro")], catalog);
    expect(item).toMatchObject({ status: "version", songId: 2 });
  });

  it("marca como nova a faixa sem correspondência", () => {
    const [item] = matchTracksToCatalog([track("x3", "Música Inédita")], catalog);
    expect(item).toMatchObject({ status: "new", songId: null, songTitle: null });
  });

  it("não cria correspondência quando o título fica vazio", () => {
    const [item] = matchTracksToCatalog([track("x4", "(ao vivo)")], catalog);
    expect(item?.status).toBe("new");
  });

  it("mantém a ordem e tira faixas repetidas", () => {
    const items = matchTracksToCatalog([track("a", "Música Inédita"), track("t1", "x"), track("a", "Música Inédita")], catalog);
    expect(items.map((item) => item.id)).toEqual(["a", "t1"]);
  });
});
