import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { Role } from '../generated/prisma/enums';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken } from '../services/token.service';

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    return;
  }
  if (password.length < 6) {
    res
      .status(400)
      .json({ message: 'A senha precisa ter ao menos 6 caracteres.' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'Este email já está cadastrado.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: Role.CUSTOMER },
  });

  const token = generateToken(user.id, user.role);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches =
    user && (await comparePassword(password, user.passwordHash));

  if (!user || !passwordMatches) {
    res.status(401).json({ message: 'Email ou senha inválidos.' });
    return;
  }

  const token = generateToken(user.id, user.role);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Não autenticado.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    res.status(404).json({ message: 'Usuário não encontrado.' });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
