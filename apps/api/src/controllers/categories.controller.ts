import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Lista pública: o combobox de categoria no formulário do organizador e o
// filtro do catálogo público leem daqui. `_count.events` é o que permite ao
// front avisar "esta categoria está em N eventos" antes de confirmar a
// exclusão, sem uma segunda chamada.
export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { events: true } } },
  });

  res.json({
    items: categories.map((category) => ({
      id: category.id,
      name: category.name,
      eventCount: category._count.events,
    })),
  });
}

type CreateCategoryBody = {
  name?: string;
};

// Idempotente por nome (case-insensitive): o formulário de evento chama isto
// tanto para uma categoria já existente quanto para uma nova digitada na
// hora — o organizador não precisa saber qual dos dois casos é o dele.
export async function createCategory(req: Request, res: Response) {
  const { name } = req.body as CreateCategoryBody;
  const trimmed = name?.trim();

  if (!trimmed) {
    res.status(400).json({ message: 'name é obrigatório.' });
    return;
  }

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
  });
  if (existing) {
    res.status(200).json(existing);
    return;
  }

  const created = await prisma.category.create({ data: { name: trimmed } });
  res.status(201).json(created);
}

export async function deleteCategory(req: Request, res: Response) {
  const id = req.params.id as string;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Categoria não encontrada.' });
    return;
  }

  // A remoção do vínculo nos eventos é feita pelo próprio banco
  // (Event.categoryId tem ON DELETE SET NULL — schema.prisma), não por
  // lógica de aplicação: não há como um evento ficar apontando para uma
  // categoria que não existe mais.
  await prisma.category.delete({ where: { id } });
  res.status(204).send();
}
