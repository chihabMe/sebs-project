import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Admin API', () => {
  it('should list all users for ADMIN', async () => {
    const { token } = await createUser('ADMIN');
    
    const res = await api.get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should fail to list users for ORGANIZER', async () => {
    const { token } = await createUser('ORGANIZER');
    
    const res = await api.get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should ban a user as ADMIN', async () => {
    const { token } = await createUser('ADMIN');
    const { user: targetUser } = await createUser('USER');
    
    const res = await api.patch(`/api/admin/users/${targetUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isBanned: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isBanned).toBe(true);
  });

  it('should fail to list users for regular USER', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 when banning a non-existent user', async () => {
    const { token } = await createUser('ADMIN');
    
    const res = await api.patch('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ isBanned: true });

    expect(res.status).toBe(404);
  });

  it('should fail to access admin metrics for non-admin', async () => {
    const { token } = await createUser('ORGANIZER');
    
    const res = await api.get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
