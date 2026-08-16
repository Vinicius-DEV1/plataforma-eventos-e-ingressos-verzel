import { Router } from 'express';
import {
  createQuantityReservation,
  createSeatReservation,
  listMyReservations,
} from '../controllers/reservations.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '../generated/prisma/enums';

export const reservationsRouter = Router();

/**
 * @openapi
 * /reservas/assento:
 *   post:
 *     summary: Reserva um assento em um evento CINEMA
 *     description: >
 *       Exclusividade garantida por update condicional dentro de uma
 *       transação (SPEC.md §2.1), não pela constraint de unicidade do
 *       assento — por isso duas requisições simultâneas para o mesmo
 *       assento nunca resultam em duas reservas. A reserva expira em 15
 *       minutos se não for paga (verificação lazy, SPEC.md §2.3).
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, seatId]
 *             properties:
 *               eventId:
 *                 type: string
 *               seatId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reserva criada, com expiresAt em 15 minutos
 *       400:
 *         description: Campos ausentes ou evento não é do tipo CINEMA
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de CUSTOMER
 *       404:
 *         description: Evento ou assento não encontrado
 *       409:
 *         description: Assento já reservado/vendido, ou evento cancelado
 */
reservationsRouter.post(
  '/reservas/assento',
  authenticate,
  requireRole(Role.CUSTOMER),
  createSeatReservation,
);

/**
 * @openapi
 * /reservas/quantidade:
 *   post:
 *     summary: Reserva N ingressos em um evento SHOW
 *     description: >
 *       O estoque (`Event.availableTickets`) é verificado e decrementado
 *       atomicamente via update condicional (`WHERE availableTickets >=
 *       quantity`), a mesma estratégia usada na reserva de assento
 *       (SPEC.md §2.2) — evita overselling sob requisições simultâneas. A
 *       reserva expira em 15 minutos se não for paga (verificação lazy,
 *       SPEC.md §2.3).
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, quantity]
 *             properties:
 *               eventId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Reserva criada, com expiresAt em 15 minutos
 *       400:
 *         description: Campos inválidos ou evento não é do tipo SHOW
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de CUSTOMER
 *       404:
 *         description: Evento não encontrado
 *       409:
 *         description: Ingressos insuficientes, ou evento cancelado
 */
reservationsRouter.post(
  '/reservas/quantidade',
  authenticate,
  requireRole(Role.CUSTOMER),
  createQuantityReservation,
);

/**
 * @openapi
 * /reservas/minhas:
 *   get:
 *     summary: Lista as reservas do cliente logado
 *     description: Qualquer status (PENDING, PAID, DECLINED, CANCELLED, EXPIRED), mais recentes primeiro.
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reservas do cliente logado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de CUSTOMER
 */
reservationsRouter.get(
  '/reservas/minhas',
  authenticate,
  requireRole(Role.CUSTOMER),
  listMyReservations,
);
