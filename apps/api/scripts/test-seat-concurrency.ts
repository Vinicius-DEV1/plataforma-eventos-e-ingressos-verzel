// Fires two POST /reservas/assento at the exact same seat, from two
// different customers, at (as close as JS allows) the same instant, to
// verify the conditional-update strategy in SPEC.md §2.1 actually resolves
// the race: exactly one request should succeed (201), the other should be
// rejected (409). Run against a running API + seeded database:
//
//   npm run test:concurrency --workspace=apps/api
//
// Uses the two customer accounts from prisma/seed.ts by default.

const API_URL = process.env.API_URL ?? 'http://localhost:3333';
const CUSTOMER_1 = {
  email: process.env.CUSTOMER1_EMAIL ?? 'cliente1@teste.com',
  password: process.env.CUSTOMER1_PASSWORD ?? 'senha123',
};
const CUSTOMER_2 = {
  email: process.env.CUSTOMER2_EMAIL ?? 'cliente2@teste.com',
  password: process.env.CUSTOMER2_PASSWORD ?? 'senha123',
};

type LoginResponse = { token: string };
type EventItem = { id: string; type: 'CINEMA' | 'SHOW'; status: string };
type Seat = { id: string; status: string };

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Login falhou para ${email}: HTTP ${response.status}`);
  }
  const data = (await response.json()) as LoginResponse;
  return data.token;
}

async function findCinemaEventWithAvailableSeat(): Promise<{
  eventId: string;
  seatId: string;
}> {
  const eventsResponse = await fetch(`${API_URL}/eventos`);
  const { items: events } = (await eventsResponse.json()) as {
    items: EventItem[];
  };

  for (const event of events.filter((e) => e.type === 'CINEMA')) {
    const seatsResponse = await fetch(
      `${API_URL}/eventos/${event.id}/assentos`,
    );
    const { items: seats } = (await seatsResponse.json()) as { items: Seat[] };
    const availableSeat = seats.find((seat) => seat.status === 'AVAILABLE');
    if (availableSeat) {
      return { eventId: event.id, seatId: availableSeat.id };
    }
  }

  throw new Error(
    'Nenhum evento CINEMA com assento disponível encontrado. Crie um evento CINEMA antes de rodar o script.',
  );
}

async function reserveSeat(
  token: string,
  eventId: string,
  seatId: string,
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}/reservas/assento`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventId, seatId }),
  });
  const body: unknown = await response.json().catch(() => undefined);
  return { status: response.status, body };
}

async function main() {
  console.log('Autenticando os dois clientes...');
  const [token1, token2] = await Promise.all([
    login(CUSTOMER_1.email, CUSTOMER_1.password),
    login(CUSTOMER_2.email, CUSTOMER_2.password),
  ]);

  console.log('Procurando um evento CINEMA com assento disponível...');
  const { eventId, seatId } = await findCinemaEventWithAvailableSeat();
  console.log(`Disputando o assento ${seatId} do evento ${eventId}...\n`);

  const [result1, result2] = await Promise.all([
    reserveSeat(token1, eventId, seatId),
    reserveSeat(token2, eventId, seatId),
  ]);

  console.log('Cliente 1:', result1.status, result1.body);
  console.log('Cliente 2:', result2.status, result2.body);

  const statuses = [result1.status, result2.status].sort();
  const passed = statuses[0] === 201 && statuses[1] === 409;

  console.log(
    passed
      ? '\nPASS: exatamente uma reserva foi aceita (201) e a outra rejeitada (409).'
      : '\nFAIL: os dois resultados deveriam ser [201, 409] e vieram ' +
          JSON.stringify(statuses) +
          ' — indício de falha no controle de concorrência.',
  );
  process.exitCode = passed ? 0 : 1;
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
