import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Aplica as migrations no banco de teste uma vez, antes de toda a suíte.
// `migrate deploy` (e não `db push`) porque é o mesmo caminho que roda em
// produção: se uma migration estiver quebrada, o teste falha aqui.
export default function globalSetup(): void {
  const envFile = path.resolve(__dirname, '..', '.env.test');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
      if (!match || match[1].startsWith('#')) continue;
      process.env[match[1]] ??= (match[2] ?? '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
    }
  }

  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
}
