import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Booking API', () => {
  it('should create a booking for a user', async () => {
    const { token, user } = await createUser('USER');
    
    // Create an event directly in DB
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Testing bookings',
        date: new Date(Date.now() + 86400000),
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        organizerId: user.id, // technically an organizer should own it, but foreign key doesn't strictly check role
      }
    });

    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: event.id
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventId).toBe(event.id);
  });

  it('should list my bookings', async () => {
    const { token } = await createUser('USER');
    
    const res = await api.get('/api/bookings/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
