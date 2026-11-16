import { describe, expect, it } from "vitest";
import { detectPolicyBrowser, fullscreenPolicyFile, removePolicyFile } from "./fullscreen-policy";

const BACKSLASH = String.fromCharCode(92);
const chromeKey = ["HKEY_LOCAL_MACHINE", "SOFTWARE", "Policies", "Google", "Chrome"].join(BACKSLASH);

describe("fullscreenPolicyFile", () => {
  const file = fullscreenPolicyFile("chrome", "https://exemplo.app");

  it("começa com o cabeçalho do Editor do Registro e usa quebras do Windows", () => {
    expect(file.startsWith("Windows Registry Editor Version 5.00\r\n")).toBe(true);
    expect(file.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("libera tela cheia, janelas e pop-ups para o site", () => {
    for (const policy of ["AutomaticFullscreenAllowedForUrls", "WindowManagementAllowedForUrls", "PopupsAllowedForUrls"]) {
      expect(file).toContain(`[${chromeKey}${BACKSLASH}${policy}]\r\n"1"="https://exemplo.app"`);
    }
  });

  it("usa a chave do Edge quando pedido", () => {
    expect(fullscreenPolicyFile("edge", "https://exemplo.app")).toContain(["Policies", "Microsoft", "Edge"].join(BACKSLASH));
  });
});

describe("removePolicyFile", () => {
  it("remove as três permissões de cada navegador", () => {
    const file = removePolicyFile();
    expect(file.match(/\[-HKEY_LOCAL_MACHINE/g)).toHaveLength(9);
    expect(file).toContain(`[-${chromeKey}${BACKSLASH}PopupsAllowedForUrls]`);
  });
});

describe("detectPolicyBrowser", () => {
  it("reconhece o Edge e trata o resto como Chrome", () => {
    expect(detectPolicyBrowser("Mozilla/5.0 Chrome/140.0 Safari/537.36 Edg/140.0")).toBe("edge");
    expect(detectPolicyBrowser("Mozilla/5.0 Chrome/140.0 Safari/537.36")).toBe("chrome");
  });
});
