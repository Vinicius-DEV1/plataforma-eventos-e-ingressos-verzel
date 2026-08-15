import { defineConfig } from 'prisma/config';

/*
 * O arquivo gerado pelo `prisma init` carrega as variáveis com `dotenv`. Aqui
 * usamos `process.loadEnvFile`, a API nativa equivalente (Node 20.12+), para
 * não introduzir uma dependência que a aplicação decidiu não ter — ver
 * docs/DECISIONS.md, "Variáveis de ambiente".
 *
 * O try/catch cobre o ambiente de produção, onde não existe arquivo .env e as
 * variáveis chegam pelo próprio ambiente.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // Sem arquivo .env: as variáveis vêm do ambiente.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
