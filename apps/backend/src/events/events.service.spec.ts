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
  } as any;

  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prisma);
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
});
