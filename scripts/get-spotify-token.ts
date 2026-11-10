import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import readline from "node:readline/promises";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:8888/callback";
const SCOPES = "playlist-modify-public playlist-modify-private";

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("❌ Defina SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env");
  process.exit(1);
}

const state = randomBytes(8).toString("hex");
const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  client_id: SPOTIFY_CLIENT_ID,
  response_type: "code",
  redirect_uri: REDIRECT_URI,
  scope: SCOPES,
  state,
  show_dialog: "true",
}).toString()}`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function parseCode(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    return new URL(value).searchParams.get("code");
  } catch {
    return value;
  }
}

function waitForCallback(redirect: URL): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", redirect.origin);
      if (url.pathname !== redirect.pathname) {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const valid = url.searchParams.get("state") === state;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        code && valid
          ? "<h2>✅ Autorizado! Pode fechar esta aba e voltar ao terminal.</h2>"
          : `<h2>❌ Autorização recusada: ${error ?? "resposta inválida"}</h2>`
      );
      server.close();
      if (code && valid) resolve(code);
      else reject(new Error(error ?? "Resposta inválida do Spotify"));
    });
    server.on("error", reject);
    server.listen(Number(redirect.port || 80), redirect.hostname);
  });
}

async function obtainCode(): Promise<string> {
  const redirect = new URL(REDIRECT_URI);
  if (redirect.protocol === "http:" && redirect.hostname === "127.0.0.1") {
    try {
      const pending = waitForCallback(redirect);
      console.log(`\n⏳ Aguardando a autorização em ${redirect.origin}${redirect.pathname} …`);
      return await pending;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`\n⚠️  Não foi possível escutar em ${redirect.host} (${message}).`);
    }
  }
  const answer = await rl.question("\nCole aqui a URL inteira para onde o Spotify redirecionou (ou só o código): ");
  const code = parseCode(answer);
  if (!code) throw new Error("Nenhum código informado.");
  return code;
}

async function saveToEnv(token: string): Promise<void> {
  const file = ".env";
  const content = await readFile(file, "utf8");
  const line = `SPOTIFY_REFRESH_TOKEN=${token}`;
  const updated = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(content)
    ? content.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, line)
    : `${content.trimEnd()}\n${line}\n`;
  await writeFile(file, updated);
}

try {
  console.log("🎧 WEBCHURCH — NOVO TOKEN DO SPOTIFY");
  console.log("=======================================");
  console.log(`\n0️⃣  No painel do aplicativo (developer.spotify.com), em Settings → Redirect URIs, cadastre:\n   ${REDIRECT_URI}`);
  console.log("\n1️⃣  Abra esta URL no navegador e autorize com a conta DONA da playlist:\n");
  console.log(authUrl);

  const code = await obtainCode();
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    refresh_token?: string;
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !body.refresh_token || !body.access_token) {
    throw new Error(`${body.error ?? response.status} ${body.error_description ?? ""}`.trim());
  }

  const me = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${body.access_token}` } });
  if (me.ok) {
    const profile = (await me.json()) as { display_name?: string; id?: string };
    console.log(`\n✅ Autorizado como "${profile.display_name ?? profile.id}".`);
  }
  console.log(`   Permissões: ${body.scope ?? SCOPES}`);

  console.log(`\nSPOTIFY_REFRESH_TOKEN=${body.refresh_token}\n`);
  const save = await rl.question("Gravar no arquivo .env agora? (s/N) ");
  if (save.trim().toLowerCase().startsWith("s")) {
    await saveToEnv(body.refresh_token);
    console.log("💾 .env atualizado. Reinicie o servidor (npm run dev / start).");
  }
  console.log("\n📌 Na Vercel: Settings → Environment Variables → SPOTIFY_REFRESH_TOKEN → cole o valor acima e faça redeploy.");
} catch (error) {
  console.error("\n❌ ERRO AO OBTER TOKEN:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
}
