import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';

describe('EventsService', () => {
  const prisma = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
  } as any;
  const mailService = {
    sendEventUpdated: jest.fn().mockResolvedValue(true),
  } as any;

  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prisma, mailService);
  });

  it('create should auto-approve admin-created events', async () => {
    prisma.event.create.mockResolvedValue({ id: 'e1', isApproved: true });

    await service.create(
      'u1',
      'ADMIN',
      {
        title: 'Event',
        description: 'Event description long enough',
        date: new Date().toISOString(),
        location: 'Online',
        category: 'Tech',
        maxTickets: 100,
        price: 0,
      },
      undefined,
    );

    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizerId: 'u1',
          isApproved: true,
        }),
      }),
    );
  });

  it('findOne should throw for missing event', async () => {
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne should hide unapproved event from public access', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', isApproved: false });
    await expect(service.findOne('e1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOneForManager should allow organizer to access unapproved event', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', organizerId: 'owner-id', isApproved: false });
    const event = await service.findOneForManager('e1', 'owner-id', 'ORGANIZER');
    expect(event.id).toBe('e1');
  });

  it('update should block non-owner non-admin', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', organizerId: 'owner-id', isApproved: false });
    await expect(
      service.update('e1', 'other-user', 'USER', { title: 'Updated title' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove should allow admin', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', organizerId: 'owner-id', isApproved: false });
    prisma.event.delete.mockResolvedValue({ id: 'e1' });

    await service.remove('e1', 'admin-user', 'ADMIN');
    expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
  });

  it('update should notify confirmed attendees when date changes', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'e1',
      organizerId: 'owner-id',
      isApproved: true,
      date: new Date('2026-05-10T10:00:00.000Z'),
      location: 'Old Hall',
    });
    prisma.event.update.mockResolvedValue({
      id: 'e1',
      title: 'Event',
      date: new Date('2026-05-11T10:00:00.000Z'),
      location: 'Old Hall',
    });
    prisma.booking.findMany.mockResolvedValue([
      { id: 'b1', user: { id: 'u1', name: 'User', email: 'user@example.com' } },
    ]);

    await service.update('e1', 'owner-id', 'ORGANIZER', { date: '2026-05-11T10:00:00.000Z' });

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { eventId: 'e1', status: 'CONFIRMED' },
      include: { user: true },
    });
    expect(mailService.sendEventUpdated).toHaveBeenCalled();
  });
});
