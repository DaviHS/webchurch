import { describe, expect, it } from "vitest";
import { REMOTE_MESSAGE_MAX, remoteCommandSchema, remoteStateSchema } from "./remote-protocol";

describe("remoteCommandSchema", () => {
  it("aceita adicionar música, passagem e avisos", () => {
    for (const command of [
      { type: "addSong", songId: 12 },
      { type: "addPassage", reference: "Jo 3:16-18", version: "NVI", perSlide: 1 },
      { type: "addPassage", reference: "Sl 23", version: "ARA", perSlide: null },
      { type: "projectorMessage", message: "Favor silenciar os celulares" },
      { type: "stageMessage", message: "" },
    ]) {
      expect(remoteCommandSchema.safeParse(command).success).toBe(true);
    }
  });

  it("recusa valores fora do limite", () => {
    for (const command of [
      { type: "addSong", songId: 0 },
      { type: "addPassage", reference: "", version: "NVI", perSlide: 1 },
      { type: "addPassage", reference: "Jo 3:16", version: "NVI", perSlide: 7 },
      { type: "projectorMessage", message: "x".repeat(REMOTE_MESSAGE_MAX + 1) },
    ]) {
      expect(remoteCommandSchema.safeParse(command).success).toBe(false);
    }
  });
});

describe("remoteStateSchema", () => {
  const base = { title: "Culto", mode: "live", songTitle: null, live: null, next: null, position: null };

  it("aceita o estado antigo, sem os avisos", () => {
    expect(remoteStateSchema.safeParse(base).success).toBe(true);
  });

  it("aceita o estado com os avisos", () => {
    expect(remoteStateSchema.safeParse({ ...base, projectorMessage: "Bem-vindos", stageMessage: "" }).success).toBe(true);
  });
});
