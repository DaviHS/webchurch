import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import readline from "node:readline/promises";
import { neon } from "@neondatabase/serverless";
import { auth, youtube } from "@googleapis/youtube";

const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI, DATABASE_URL } = process.env;

if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REDIRECT_URI) {
  console.error("❌ Defina YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET e YOUTUBE_REDIRECT_URI no .env");
  process.exit(1);
}

const oauth2Client = new auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/youtube"],
});

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
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        code
          ? "<h2>✅ Autorizado! Pode fechar esta aba e voltar ao terminal.</h2>"
          : `<h2>❌ Autorização recusada: ${error ?? "sem código"}</h2>`
      );
      server.close();
      if (code) resolve(code);
      else reject(new Error(error ?? "Sem código na resposta"));
    });
    server.on("error", reject);
    server.listen(Number(redirect.port || 80), redirect.hostname);
  });
}

async function obtainCode(): Promise<string> {
  const redirect = new URL(YOUTUBE_REDIRECT_URI!);
  const isLocal = ["localhost", "127.0.0.1"].includes(redirect.hostname) && redirect.protocol === "http:";

  if (isLocal) {
    try {
      const pending = waitForCallback(redirect);
      console.log(`\n⏳ Aguardando a autorização em ${redirect.origin}${redirect.pathname} …`);
      return await pending;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`\n⚠️  Não foi possível escutar em ${redirect.host} (${message}).`);
      console.warn("   (O `npm run dev` está aberto nessa porta? Feche-o ou cole o código abaixo.)");
    }
  }

  const answer = await rl.question("\nCole aqui o código (ou a URL inteira para onde o Google redirecionou): ");
  const code = parseCode(answer);
  if (!code) throw new Error("Nenhum código informado.");
  return code;
}

async function saveToEnv(token: string): Promise<void> {
  const file = ".env";
  const content = await readFile(file, "utf8");
  const line = `YOUTUBE_REFRESH_TOKEN=${token}`;
  const updated = /^YOUTUBE_REFRESH_TOKEN=.*$/m.test(content)
    ? content.replace(/^YOUTUBE_REFRESH_TOKEN=.*$/m, line)
    : `${content.trimEnd()}\n${line}\n`;
  await writeFile(file, updated);
}

try {
  console.log("🎥 WEBCHURCH — NOVO TOKEN DO YOUTUBE");
  console.log("=======================================");
  console.log("\n1️⃣  Abra esta URL no navegador e autorize com a conta DONA da playlist:\n");
  console.log(authUrl);

  const code = await obtainCode();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.warn(
      "\n⚠️  O Google não devolveu um refresh_token. Revogue o acesso do app em " +
        "https://myaccount.google.com/permissions e rode novamente."
    );
    process.exitCode = 1;
  } else {
    oauth2Client.setCredentials(tokens);
    const stored = DATABASE_URL
      ? await neon(DATABASE_URL).query("select value from app_settings where key = 'youtube_playlist_id'")
      : [];
    const YOUTUBE_PLAYLIST_ID = (stored[0] as { value: string } | undefined)?.value;
    if (YOUTUBE_PLAYLIST_ID) {
      const client = youtube({ version: "v3", auth: oauth2Client });
      const { data } = await client.playlists.list({ part: ["snippet"], id: [YOUTUBE_PLAYLIST_ID] });
      const playlist = data.items?.[0];
      console.log(
        playlist
          ? `\n✅ Token válido — playlist "${playlist.snippet?.title}" acessível.`
          : "\n⚠️  Token válido, mas a playlist salva no banco não foi encontrada nesta conta."
      );
    }

    console.log(`\nYOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    const save = await rl.question("Gravar no arquivo .env agora? (s/N) ");
    if (save.trim().toLowerCase().startsWith("s")) {
      await saveToEnv(tokens.refresh_token);
      console.log("💾 .env atualizado. Reinicie o servidor (npm run dev / start).");
    }
    console.log(
      "\n📌 Na Vercel: Settings → Environment Variables → YOUTUBE_REFRESH_TOKEN → cole o valor acima e faça redeploy." +
        "\n📌 Para não expirar a cada 7 dias: Google Cloud → APIs e serviços → Tela de consentimento OAuth →" +
        ' "Publicar app" (status "Em produção").'
    );
  }
} catch (error) {
  console.error("\n❌ ERRO AO OBTER TOKEN:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
}
