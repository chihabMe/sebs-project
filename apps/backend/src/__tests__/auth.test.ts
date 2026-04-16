import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.token).toBeDefined();
  });

  it('should login an existing user', async () => {
    await api.post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    const res = await api.post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    
    // Test that the cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('accessToken=');
  });

  it('should fetch the current user profile', async () => {
    const { token } = await createUser();

    const res = await api.get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toContain('Test USER');
  });
  
  it('should logout user and clear cookie', async () => {
    const res = await api.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toContain('accessToken=;');
  });
});
