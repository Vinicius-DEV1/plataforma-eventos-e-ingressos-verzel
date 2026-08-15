import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../generated/prisma/enums';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res
        .status(403)
        .json({ message: 'Acesso não permitido para este papel.' });
      return;
    }
    next();
  };
}
