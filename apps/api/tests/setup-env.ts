import fs from 'node:fs';
import path from 'node:path';

// Leitor mínimo de .env, no lugar de uma dependência: a API roda com
// `--env-file` do próprio Node, que o Jest não tem. Só o suficiente para
// KEY=valor, com aspas opcionais e comentários.
function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;

    const [, key, rawValue = ''] = match;
    if (key.startsWith('#')) continue;

    const value = rawValue.trim().replace(/^['"]|['"]$/g, '');
    // Variável já definida no ambiente (CI, por exemplo) tem precedência.
    process.env[key] ??= value;
  }
}

loadEnvFile(path.resolve(__dirname, '..', '.env.test'));

process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';
process.env.JWT_SECRET ??= 'segredo-de-teste';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definida para os testes. Copie apps/api/.env.test.example para .env.test e suba o banco com `docker compose --profile test up -d postgres-test`.',
  );
}
