import fs from 'node:fs';
import path from 'node:path';

// Esta suíte lê o `.env` de desenvolvimento, não o `.env.test`: o que ela
// precisa é da ASAAS_API_KEY, que é onde ela já está. Banco não entra aqui,
// porque nada nesta suíte toca o banco.
const envFile = path.resolve(__dirname, '..', '..', '.env');

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match || match[1].startsWith('#')) continue;
    process.env[match[1]] ??= (match[2] ?? '')
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
}

process.env.TZ = 'UTC';
