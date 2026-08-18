import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role } from '../src/generated/prisma/enums';
import { authHeader, createCinemaEvent, createUser } from './helpers/factories';

const app = createApp();

describe('categorias', () => {
  it('cria uma categoria, e devolve a mesma existente ao repetir o nome', async () => {
    const organizer = await createUser(Role.ORGANIZER);

    const primeira = await request(app)
      .post('/categorias')
      .set(...authHeader(organizer.token))
      .send({ name: 'Comédia' });
    expect(primeira.status).toBe(201);

    // Mesmo nome, caixa diferente: idempotência é o que permite ao
    // formulário de evento chamar este endpoint sem saber se já existe.
    const segunda = await request(app)
      .post('/categorias')
      .set(...authHeader(organizer.token))
      .send({ name: 'comédia' });
    expect(segunda.status).toBe(200);
    expect(segunda.body.id).toBe(primeira.body.id);

    const total = await prisma.category.count();
    expect(total).toBe(1);
  });

  it('lista categorias com a contagem de eventos que as usam', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const categoria = await prisma.category.create({
      data: { name: 'Terror' },
    });
    await createCinemaEvent(organizer.id);
    await prisma.event.updateMany({ data: { categoryId: categoria.id } });

    const resposta = await request(app).get('/categorias').expect(200);
    const encontrada = (
      resposta.body.items as { name: string; eventCount: number }[]
    ).find((item) => item.name === 'Terror');

    expect(encontrada?.eventCount).toBe(1);
  });

  it('apaga uma categoria e deixa os eventos que a usavam sem categoria', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const categoria = await prisma.category.create({
      data: { name: 'Categoria errada' },
    });
    const evento = await createCinemaEvent(organizer.id);
    await prisma.event.update({
      where: { id: evento.id },
      data: { categoryId: categoria.id },
    });

    const resposta = await request(app)
      .delete(`/categorias/${categoria.id}`)
      .set(...authHeader(organizer.token));
    expect(resposta.status).toBe(204);

    const depois = await prisma.event.findUniqueOrThrow({
      where: { id: evento.id },
    });
    expect(depois.categoryId).toBeNull();

    const existeAinda = await prisma.category.findUnique({
      where: { id: categoria.id },
    });
    expect(existeAinda).toBeNull();
  });
});
