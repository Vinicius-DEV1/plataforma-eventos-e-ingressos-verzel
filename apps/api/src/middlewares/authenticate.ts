import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/token.service';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: 'Token não informado.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}
