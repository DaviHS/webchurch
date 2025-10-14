import 'dotenv/config';
import { google } from 'googleapis';
import readline from 'readline';

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

console.log('🎥 WEBCHURCH - CONFIGURAÇÃO DO YOUTUBE');
console.log('=======================================');
console.log('\n1️⃣ Acesse esta URL no seu navegador e autorize o acesso:\n');
console.log(authUrl);
console.log('\n2️⃣ Após autorizar, copie o código e cole abaixo.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Cole o código de autorização aqui: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());

    console.log('\n✅ TOKEN GERADO COM SUCESSO!');
    console.log('=======================================');
    console.log('\nAdicione isto ao seu arquivo .env:\n');
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);

    if (tokens.access_token) {
      console.log('\n🔑 Token de acesso temporário também obtido com sucesso!');
    }

    rl.close();
  } catch (error) {
    console.error('\n❌ ERRO AO OBTER TOKEN:', error);
    rl.close();
  }
});
