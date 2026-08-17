import { prisma } from '../src/config/prisma';

// Cada teste começa com o banco vazio. TRUNCATE ... CASCADE em vez de
// deleteMany por tabela: é uma instrução só, e não depende de acertar a
// ordem das chaves estrangeiras.
const TABLES = ['Payment', 'Ticket', 'Reservation', 'Seat', 'Event', 'User'];

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
