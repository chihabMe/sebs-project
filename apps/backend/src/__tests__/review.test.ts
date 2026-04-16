import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Review API', () => {
  it('should get reviews for an event', async () => {
    const { user } = await createUser('ORGANIZER');
    
    const event = await prisma.event.create({
      data: {
        title: 'Review Event',
        description: 'Testing reviews',
        date: new Date(Date.now() - 86400000), // past event
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        organizerId: user.id,
      }
    });
    
    const res = await api.get(`/api/reviews/event/${event.id}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.reviews)).toBe(true);
  });
});
