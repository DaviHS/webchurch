import { describe, expect, it } from "vitest";
import { birthdayMessage, saoPauloToday } from "./birthday-message";

describe("birthdayMessage", () => {
  it("retorna null sem aniversariantes", () => {
    expect(birthdayMessage([])).toBeNull();
  });

  it("mostra um aniversariante com a idade", () => {
    expect(birthdayMessage([{ name: "Ana Souza", turning: 30 }])).toEqual({
      title: "Aniversariante de hoje",
      body: "Ana Souza (30 anos)",
    });
  });

  it("agrupa vários aniversariantes numa só mensagem", () => {
    expect(
      birthdayMessage([
        { name: "Ana", turning: null },
        { name: "Davi", turning: 25 },
      ]),
    ).toEqual({ title: "2 aniversariantes hoje", body: "Ana, Davi (25 anos)" });
  });
});

describe("saoPauloToday", () => {
  it("usa a data de São Paulo, não a UTC", () => {
    expect(saoPauloToday(new Date("2026-03-10T02:00:00Z"))).toEqual({ iso: "2026-03-09", month: 3, day: 9 });
  });
});
