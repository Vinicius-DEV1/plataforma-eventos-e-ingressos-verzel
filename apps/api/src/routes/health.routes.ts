import { Router } from 'express';
import { verificarSaude } from '../controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/health', verificarSaude);
