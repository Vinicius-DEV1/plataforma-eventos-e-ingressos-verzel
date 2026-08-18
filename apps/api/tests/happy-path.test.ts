jest.mock('../src/integrations/asaas.client');

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import * as asaasModule from '../src/integrations/asaas.client';
import { Role } from '../src/generated/prisma/enums';
import { addDays } from '../src/utils/datetime';
import { stubAsaas } from './helpers/asaas-mock';
import { authHeader, createUser } from './helpers/factories';

const app = createApp();
const asaas = jest.mocked(asaasModule);

beforeEach(() => {
  stubAsaas(asaas);
});

// Fluxo feliz de ponta a ponta pelas rotas HTTP, sem atalho pelo banco: é o
// teste que quebra se alguma peça deixar de conversar com a seguinte.
describe('fluxo feliz: publicar, reservar, pagar e validar', () => {
  it('vai do evento criado ao ingresso validado na portaria', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    const gatekeeper = await createUser(Role.GATEKEEPER);

    // Categoria nova, criada pela mesma tela em que o organizador cadastra o
    // evento: POST /categorias é idempotente por nome, o que permite chamar
    // sempre do formulário sem saber se a categoria já existe.
    const categoria = await request(app)
      .post('/categorias')
      .set(...authHeader(organizer.token))
      .send({ name: 'Rock' });
    expect([200, 201]).toContain(categoria.status);

    const criado = await request(app)
      .post('/eventos')
      .set(...authHeader(organizer.token))
      .send({
        title: 'Show do fluxo feliz',
        description: 'Publicado pelo teste de integração.',
        imageUrl: '/images/poster_rock.jpg',
        type: 'SHOW',
        categoryId: categoria.body.id as string,
        venue: 'Casa de show',
        startsAt: addDays(new Date(), 7).toISOString(),
        basePrice: 90,
        totalCapacity: 50,
        externalSource: 'TICKETMASTER',
        externalId: 'tm-fluxo-feliz',
      });
    expect(criado.status).toBe(201);
    expect(criado.body.category).toMatchObject({ name: 'Rock' });

    const noCatalogo = await request(app).get('/eventos').expect(200);
    expect(
      (noCatalogo.body.items as { id: string }[]).some(
        (item) => item.id === criado.body.id,
      ),
    ).toBe(true);

    const reserva = await request(app)
      .post('/reservas/quantidade')
      .set(...authHeader(customer.token))
      .send({ eventId: criado.body.id as string, quantity: 2 });
    expect(reserva.status).toBe(201);
    expect(reserva.body.totalAmount).toBe(180);

    const pagamento = await request(app)
      .post(`/pagamentos/${reserva.body.id as string}/processar`)
      .set(...authHeader(customer.token))
      .send({
        method: 'CREDIT_CARD',
        card: {
          holderName: 'Cliente Teste',
          number: '4444444444444444',
          expiryMonth: '12',
          expiryYear: '2030',
          ccv: '123',
        },
      });
    expect(pagamento.status).toBe(201);
    expect(pagamento.body.status).toBe('CONFIRMED');

    const meusIngressos = await request(app)
      .get('/ingressos/meus')
      .set(...authHeader(customer.token))
      .expect(200);
    const ingressos = meusIngressos.body.items as { id: string }[];
    expect(ingressos).toHaveLength(2);

    await request(app)
      .get(`/ingressos/${ingressos[0].id}`)
      .set(...authHeader(customer.token))
      .expect(200);

    // A API devolve o QR como imagem, nunca o token em texto — ler o
    // `qrCode` do banco aqui faz as vezes da câmera da portaria, que é quem
    // extrai esse texto do código na vida real.
    const { qrCode } = await prisma.ticket.findUniqueOrThrow({
      where: { id: ingressos[0].id },
    });

    const naPortaria = await request(app)
      .post('/portaria/validar')
      .set(...authHeader(gatekeeper.token))
      .send({ code: qrCode, eventId: criado.body.id as string });
    expect(naPortaria.body).toEqual({ result: 'valid' });
  });
});
