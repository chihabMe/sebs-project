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
});
