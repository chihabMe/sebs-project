import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Events API', () => {
  it('should list all events', async () => {
    const res = await api.get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should create an event as ORGANIZER', async () => {
    const { token, user } = await createUser('ORGANIZER');
    
    // Create 3 tags
    const t1 = await prisma.tag.create({ data: { name: 'tech' } });
    const t2 = await prisma.tag.create({ data: { name: 'conference' } });
    const t3 = await prisma.tag.create({ data: { name: '2026' } });

    const res = await api.post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tech Conference 2026',
        description: 'A great tech conference.',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        tags: [t1.id, t2.id, t3.id]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Tech Conference 2026');
  });

  it('should fail to create an event as USER', async () => {
    const { token } = await createUser('USER');
    
    // Create 3 tags
    const t1 = await prisma.tag.create({ data: { name: 'hack' } });
    const t2 = await prisma.tag.create({ data: { name: 'test' } });
    const t3 = await prisma.tag.create({ data: { name: 'fail' } });

    const res = await api.post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Hacked Event',
        description: 'Should not work',
        date: new Date().toISOString(),
        location: 'Virtual',
        price: 0,
        maxTickets: 10,
        category: 'Technology',
        tags: [t1.id, t2.id, t3.id]
      });

    expect(res.status).toBe(403);
  });
});
