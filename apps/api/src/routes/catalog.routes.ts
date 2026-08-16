import { Router } from 'express';
import { getMovies, getShows } from '../controllers/catalog.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '../generated/prisma/enums';

export const catalogRouter = Router();

/**
 * @openapi
 * /catalogo/filmes:
 *   get:
 *     summary: Busca filmes no catálogo do TMDb
 *     description: >
 *       Sem o parâmetro `query`, retorna os filmes em cartaz. Respostas
 *       ficam em cache por 5 minutos para não esgotar a cota da API externa
 *       (SPEC.md §5.8).
 *     tags: [Catálogo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Termo de busca (opcional — sem ele, lista os filmes em cartaz)
 *     responses:
 *       200:
 *         description: Lista de filmes normalizada
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de ORGANIZER
 *       429:
 *         description: Limite de requisições do TMDb excedido
 */
catalogRouter.get(
  '/catalogo/filmes',
  authenticate,
  requireRole(Role.ORGANIZER),
  getMovies,
);

/**
 * @openapi
 * /catalogo/shows:
 *   get:
 *     summary: Busca shows/eventos ao vivo no catálogo do Ticketmaster Discovery
 *     tags: [Catálogo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Palavra-chave de busca (opcional)
 *     responses:
 *       200:
 *         description: Lista de shows normalizada
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de ORGANIZER
 *       429:
 *         description: Limite de requisições do Ticketmaster excedido
 */
catalogRouter.get(
  '/catalogo/shows',
  authenticate,
  requireRole(Role.ORGANIZER),
  getShows,
);
