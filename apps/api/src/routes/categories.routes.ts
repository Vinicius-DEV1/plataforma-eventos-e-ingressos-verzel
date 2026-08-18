import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
} from '../controllers/categories.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '../generated/prisma/enums';

export const categoriesRouter = Router();

/**
 * @openapi
 * /categorias:
 *   get:
 *     summary: Lista as categorias existentes
 *     description: >
 *       Rota pública. `eventCount` é quantos eventos usam cada categoria
 *       hoje — o front usa isso para avisar antes de uma exclusão.
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias
 *   post:
 *     summary: Cria uma categoria, ou devolve a existente com o mesmo nome
 *     description: >
 *       Idempotente por nome (sem diferenciar maiúsculas/minúsculas): existe
 *       para o formulário de evento poder criar uma categoria nova sem o
 *       organizador precisar saber se ela já existe.
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoria já existente com esse nome
 *       201:
 *         description: Categoria criada
 *       400:
 *         description: name ausente ou vazio
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de ORGANIZER
 */
categoriesRouter.get('/categorias', listCategories);
categoriesRouter.post(
  '/categorias',
  authenticate,
  requireRole(Role.ORGANIZER),
  createCategory,
);

/**
 * @openapi
 * /categorias/{id}:
 *   delete:
 *     summary: Apaga uma categoria
 *     description: >
 *       Eventos que usavam esta categoria não são apagados nem bloqueiam a
 *       exclusão: `Event.categoryId` tem `ON DELETE SET NULL`, então eles
 *       simplesmente ficam sem categoria. O front avisa quantos eventos
 *       serão afetados antes de confirmar, usando o `eventCount` de
 *       `GET /categorias`.
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Categoria apagada
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de ORGANIZER
 *       404:
 *         description: Categoria não encontrada
 */
categoriesRouter.delete(
  '/categorias/:id',
  authenticate,
  requireRole(Role.ORGANIZER),
  deleteCategory,
);
