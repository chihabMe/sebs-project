import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const api = request(app);

export const createUser = async (role = 'USER') => {
  const user = await prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: `test${Date.now()}@example.com`,
      password: '$2a$10$eWkZ0B2XvQYwP4kR5xZ7k.QO1hZqHj1/Z0nOq0rO1/Z0nOq0rO1/Z', // 'password'
      role: role as any,
    },
  });
  
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
  
  return { user, token };
};
