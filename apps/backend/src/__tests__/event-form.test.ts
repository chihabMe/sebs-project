import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Event Form API', () => {
  it('should get form questions for an event', async () => {
    const { user } = await createUser('ORGANIZER');
    
    const event = await prisma.event.create({
      data: {
        title: 'Form Event',
        description: 'Testing forms',
        date: new Date(Date.now() + 86400000),
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        organizerId: user.id,
      }
    });
    
    const res = await api.get(`/api/event-forms/${event.id}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return 404 for a non-existent event form', async () => {
    const res = await api.get('/api/event-forms/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should fail to update an event form as USER', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.put('/api/event-forms/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        schema: {
          fields: [{ type: 'text', name: 'company', label: 'Company', required: true }]
        }
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
