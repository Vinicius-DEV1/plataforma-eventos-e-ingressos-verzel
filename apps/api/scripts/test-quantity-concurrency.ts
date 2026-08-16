// Fires two POST /reservas/quantidade at the same SHOW event, from two
// different customers, at (as close as JS allows) the same instant, each
// asking for slightly more than half the remaining stock — so the sum of
// both requests exceeds what's available, but neither request alone would
// be rejected by a naive (non-atomic) check. Verifies the conditional
// decrement in SPEC.md §2.2 actually prevents overselling: exactly one
// request should succeed (201), the other should be rejected (409). Run
// against a running API + seeded database:
//
//   npm run test:concurrency:quantity --workspace=apps/api
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
type EventItem = {
  id: string;
  type: 'CINEMA' | 'SHOW';
  status: string;
  availableTickets: number;
};

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

async function findShowEventWithStock(): Promise<{
  eventId: string;
  quantityEach: number;
}> {
  const eventsResponse = await fetch(`${API_URL}/eventos`);
  const { items: events } = (await eventsResponse.json()) as {
    items: EventItem[];
  };

  const event = events.find(
    (e) => e.type === 'SHOW' && e.availableTickets >= 2,
  );
  if (!event) {
    throw new Error(
      'Nenhum evento SHOW com pelo menos 2 ingressos disponíveis encontrado. Crie um evento SHOW antes de rodar o script.',
    );
  }

  // Each customer asks for slightly more than half: individually valid,
  // but the two together exceed the stock.
  const quantityEach = Math.floor(event.availableTickets / 2) + 1;
  return { eventId: event.id, quantityEach };
}

async function reserveQuantity(
  token: string,
  eventId: string,
  quantity: number,
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}/reservas/quantidade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventId, quantity }),
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

  console.log('Procurando um evento SHOW com estoque suficiente...');
  const { eventId, quantityEach } = await findShowEventWithStock();
  console.log(
    `Disputando o evento ${eventId}: os dois clientes pedem ${quantityEach} ingressos cada, ao mesmo tempo...\n`,
  );

  const [result1, result2] = await Promise.all([
    reserveQuantity(token1, eventId, quantityEach),
    reserveQuantity(token2, eventId, quantityEach),
  ]);

  console.log('Cliente 1:', result1.status, result1.body);
  console.log('Cliente 2:', result2.status, result2.body);

  const statuses = [result1.status, result2.status].sort();
  const passed = statuses[0] === 201 && statuses[1] === 409;

  console.log(
    passed
      ? '\nPASS: exatamente uma reserva foi aceita (201) e a outra rejeitada (409) por falta de estoque.'
      : '\nFAIL: os dois resultados deveriam ser [201, 409] e vieram ' +
          JSON.stringify(statuses) +
          ' — indício de overselling no controle de concorrência.',
  );
  process.exitCode = passed ? 0 : 1;
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
