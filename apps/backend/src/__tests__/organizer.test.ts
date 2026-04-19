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

  it('should fail to list attendees as a regular USER', async () => {
    const { token } = await createUser('USER');
    
    // Create an event with an organizer
    const organizer = await createUser('ORGANIZER');
    const event = await prisma.event.create({
      data: {
        title: 'User Attendee Test',
        description: 'Testing attendees access',
        date: new Date(Date.now() + 86400000),
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        organizerId: organizer.user.id,
      }
    });

    const res = await api.get(`/api/organizer/event/${event.id}/attendees`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should fail to list attendees for an event not owned by the organizer', async () => {
    const { token } = await createUser('ORGANIZER'); // Organizer 1
    const organizer2 = await createUser('ORGANIZER'); // Organizer 2

    const event = await prisma.event.create({
      data: {
        title: 'Another Organizer Event',
        description: 'Testing ownership',
        date: new Date(Date.now() + 86400000),
        location: 'Virtual',
        price: 0,
        maxTickets: 100,
        category: 'Technology',
        organizerId: organizer2.user.id, // Owned by Organizer 2
      }
    });

    const res = await api.get(`/api/organizer/event/${event.id}/attendees`)
      .set('Authorization', `Bearer ${token}`); // Requesting as Organizer 1

    expect(res.status).toBe(403); // Or 404
  });

  it('should return 404 when listing attendees for a non-existent event', async () => {
    const { token } = await createUser('ORGANIZER');
    
    const res = await api.get('/api/organizer/event/00000000-0000-0000-0000-000000000000/attendees')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
