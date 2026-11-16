export const POLICY_BROWSERS = {
  chrome: { label: "Chrome", key: String.raw`HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome` },
  edge: { label: "Edge", key: String.raw`HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge` },
  brave: { label: "Brave", key: String.raw`HKEY_LOCAL_MACHINE\SOFTWARE\Policies\BraveSoftware\Brave` },
} as const;

export type PolicyBrowser = keyof typeof POLICY_BROWSERS;

const POLICIES = ["AutomaticFullscreenAllowedForUrls", "WindowManagementAllowedForUrls", "PopupsAllowedForUrls"] as const;
const HEADER = "Windows Registry Editor Version 5.00";
const SEPARATOR = String.raw`\ `.trim();

export function fullscreenPolicyFile(browser: PolicyBrowser, origin: string): string {
  const root = POLICY_BROWSERS[browser].key;
  const blocks = POLICIES.map((policy) => `[${root}${SEPARATOR}${policy}]\r\n"1"="${origin}"`);
  return [HEADER, `[${root}]`, ...blocks, ""].join("\r\n\r\n");
}

export function removePolicyFile(): string {
  const blocks = Object.values(POLICY_BROWSERS).flatMap((browser) => POLICIES.map((policy) => `[-${browser.key}${SEPARATOR}${policy}]`));
  return [HEADER, ...blocks, ""].join("\r\n\r\n");
}

export function detectPolicyBrowser(userAgent: string): PolicyBrowser {
  return userAgent.includes("Edg/") ? "edge" : "chrome";
}

export function downloadTextFile(name: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "application/octet-stream" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
