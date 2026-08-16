import { Router } from 'express';
import {
  cancelEvent,
  createEvent,
  getEvent,
  listEvents,
  listMyEvents,
  updateEvent,
} from '../controllers/events.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '../generated/prisma/enums';

export const eventsRouter = Router();

/**
 * @openapi
 * /eventos:
 *   get:
 *     summary: Lista eventos publicados
 *     description: Rota pública. Filtros por data, categoria, local e preço chegam no Bloco 9.
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Lista de eventos publicados
 *   post:
 *     summary: Cria um evento a partir de um item do catálogo externo
 *     description: >
 *       O tipo do evento e a fonte do catálogo são vinculados: CINEMA vem do
 *       TMDb, SHOW vem do Ticketmaster (PRD.md §3.1). Eventos CINEMA geram
 *       automaticamente o mapa de assentos (8x12); `totalCapacity` só é
 *       aceito para eventos SHOW.
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, imageUrl, type, category, venue, startsAt, basePrice, externalSource, externalId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CINEMA, SHOW]
 *               category:
 *                 type: string
 *               venue:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               basePrice:
 *                 type: number
 *               totalCapacity:
 *                 type: integer
 *                 description: Obrigatório apenas para eventos SHOW
 *               externalSource:
 *                 type: string
 *                 enum: [TMDB, TICKETMASTER]
 *               externalId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Evento criado
 *       400:
 *         description: Dados inválidos ou incompatíveis (ex. type/externalSource)
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de ORGANIZER
 */
eventsRouter.get('/eventos', listEvents);
eventsRouter.post(
  '/eventos',
  authenticate,
  requireRole(Role.ORGANIZER),
  createEvent,
);

/**
 * @openapi
 * /eventos/meus:
 *   get:
 *     summary: Lista todos os eventos do organizador logado
 *     description: >
 *       Inclui eventos com qualquer status (PUBLISHED e CANCELLED) — a
 *       listagem pública em `GET /eventos` só mostra os publicados, então
 *       esta é a forma do organizador ver o que ele mesmo cancelou.
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de eventos do organizador logado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de ORGANIZER
 */
eventsRouter.get(
  '/eventos/meus',
  authenticate,
  requireRole(Role.ORGANIZER),
  listMyEvents,
);

/**
 * @openapi
 * /eventos/{id}:
 *   get:
 *     summary: Detalhe de um evento
 *     description: Rota pública. Inclui o mapa de assentos quando o evento é CINEMA.
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhe do evento
 *       404:
 *         description: Evento não encontrado
 *   put:
 *     summary: Edita um evento
 *     description: >
 *       Apenas o organizador dono do evento pode editar. Não altera type,
 *       externalSource/externalId nem capacidade/assentos — esses campos
 *       identificam o evento e sua estrutura de venda.
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               category:
 *                 type: string
 *               venue:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               basePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Evento atualizado
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não é o organizador dono do evento
 *       404:
 *         description: Evento não encontrado
 *       409:
 *         description: Evento já cancelado
 *   delete:
 *     summary: Cancela um evento
 *     description: >
 *       Cascata em transação (SPEC.md §4.1): reservas PENDING/PAID e
 *       ingressos VALID do evento são cancelados, e os assentos voltam a
 *       ficar disponíveis. Ingressos já USED não são alterados.
 *     tags: [Eventos]
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
 *         description: Evento cancelado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não é o organizador dono do evento
 *       404:
 *         description: Evento não encontrado
 *       409:
 *         description: Evento já cancelado
 */
eventsRouter.get('/eventos/:id', getEvent);
eventsRouter.put(
  '/eventos/:id',
  authenticate,
  requireRole(Role.ORGANIZER),
  updateEvent,
);
eventsRouter.delete(
  '/eventos/:id',
  authenticate,
  requireRole(Role.ORGANIZER),
  cancelEvent,
);
