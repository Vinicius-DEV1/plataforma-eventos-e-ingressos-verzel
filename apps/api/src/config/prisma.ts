import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/*
 * Instância única do Prisma Client compartilhada pela aplicação.
 *
 * A partir da versão 7 o Prisma não embute mais o driver do banco: a conexão
 * passa por um adapter explícito (aqui o `@prisma/adapter-pg`, para
 * PostgreSQL), que recebe a connection string.
 *
 * A instância é guardada no escopo global fora de produção porque o
 * `tsx watch` recarrega os módulos a cada alteração; sem isso, cada
 * salvamento abriria um novo pool de conexões e o banco esgotaria os slots
 * disponíveis em poucas edições.
 */
const globalParaPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function criarClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL não definida. Copie apps/api/.env.example para .env.',
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalParaPrisma.prisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') {
  globalParaPrisma.prisma = prisma;
}
