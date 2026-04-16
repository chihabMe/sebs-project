import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Organizer API', () => {
  it('should list attendees for an organizer event', async () => {
    const { token, user } = await createUser('ORGANIZER');
    
    const event = await prisma.event.create({
      data: {
        title: 'Test Event 2',
        description: 'Testing attendees',
        date: new Date(Date.now() + 86400000),
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        organizerId: user.id,
      }
    });
    
    const res = await api.get(`/api/organizer/event/${event.id}/attendees`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
