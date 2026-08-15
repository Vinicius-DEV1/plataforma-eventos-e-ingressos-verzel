import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';

export const authRouter = Router();

/**
 * @openapi
 * /auth/registro:
 *   post:
 *     summary: Cria uma conta de cliente
 *     description: >
 *       Cadastro público. Sempre cria o usuário com o papel CUSTOMER —
 *       organizador e portaria existem apenas via seed (PRD.md §3.12).
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Conta criada, token retornado
 *       400:
 *         description: Campos obrigatórios ausentes ou senha curta
 *       409:
 *         description: Email já cadastrado
 */
authRouter.post('/auth/registro', register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário
 *     description: Funciona para os três papéis (CUSTOMER, ORGANIZER, GATEKEEPER).
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login válido, token retornado
 *       400:
 *         description: Campos obrigatórios ausentes
 *       401:
 *         description: Email ou senha inválidos
 */
authRouter.post('/auth/login', login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário logado
 *       401:
 *         description: Token ausente, inválido ou expirado
 */
authRouter.get('/auth/me', authenticate, me);
