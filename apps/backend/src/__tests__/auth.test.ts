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

  it('should fail to register with an existing email', async () => {
    await api.post('/api/auth/register').send({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
    });

    const res = await api.post('/api/auth/register').send({
      name: 'Another User',
      email: 'existing@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail to login with incorrect password', async () => {
    await api.post('/api/auth/register').send({
      name: 'Wrong Pass User',
      email: 'wrongpass@example.com',
      password: 'password123',
    });

    const res = await api.post('/api/auth/login').send({
      email: 'wrongpass@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail to login with non-existent email', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401); // Or 404 depending on the implementation
    expect(res.body.success).toBe(false);
  });
});
