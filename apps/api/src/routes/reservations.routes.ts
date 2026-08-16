import { Router } from 'express';
import { createSeatReservation } from '../controllers/reservations.controller';
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
