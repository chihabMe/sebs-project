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

  it('should fail to book an event that is full', async () => {
    const { token } = await createUser('USER');
    
    // Create an event with maxTickets = 0
    const event = await prisma.event.create({
      data: {
        title: 'Full Event',
        description: 'No tickets left',
        date: new Date(Date.now() + 86400000),
        location: 'Virtual',
        price: 0,
        maxTickets: 0,
        category: 'Technology',
        organizerId: (await createUser('ORGANIZER')).user.id,
      }
    });

    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: event.id
      });

    expect(res.status).toBe(400); // Bad Request for full event
    expect(res.body.success).toBe(false);
  });

  it('should fail to book a non-existent event', async () => {
    const { token } = await createUser('USER');

    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: '00000000-0000-0000-0000-000000000000'
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 when canceling a non-existent booking', async () => {
    const { token } = await createUser('USER');

    const res = await api.patch('/api/bookings/00000000-0000-0000-0000-000000000000/cancel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
