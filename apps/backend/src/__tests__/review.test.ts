import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

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

  it('should fail to create review for non-existent event', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: crypto.randomUUID(),
        rating: 5,
        comment: 'Great event!'
      });

    expect(res.status).toBe(404);
  });

  it('should fail to create review as unauthenticated user', async () => {
    const res = await api.post('/api/reviews')
      .send({
        eventId: crypto.randomUUID(),
        rating: 5,
        comment: 'Great event!'
      });

    expect(res.status).toBe(401);
  });

  it('should fail to delete someone else\'s review', async () => {
    const { user: organizer } = await createUser('ORGANIZER');
    const { user: user1 } = await createUser('USER');
    const { token: user2Token } = await createUser('USER');

    const event = await prisma.event.create({
      data: {
        title: 'Another Review Event',
        description: 'Testing review deletion',
        date: new Date(Date.now() - 86400000),
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        organizerId: organizer.id,
      }
    });

    const review = await prisma.review.create({
      data: {
        rating: 5,
        comment: 'Awesome',
        userId: user1.id,
        eventId: event.id
      }
    });

    const res = await api.delete(`/api/reviews/${review.id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
  });
});
