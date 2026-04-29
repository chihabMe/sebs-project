import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
  } as any;

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma);
  });

  it('getProfile should return selected user fields', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      role: 'USER',
      avatar: null,
      bio: null,
      tags: [],
    });

    const profile = await service.getProfile('u1');
    expect(profile.email).toBe('user@example.com');
  });

  it('getProfile should throw when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateProfile should map tags to connect payload', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'Updated',
      role: 'USER',
      avatar: null,
      bio: 'Bio',
      tags: [{ id: 't1', name: 'Music' }],
    });

    await service.updateProfile('u1', { name: 'Updated', tags: ['t1'] });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          name: 'Updated',
          tags: {
            set: [{ id: 't1' }],
          },
        }),
      }),
    );
  });

  it('getAttendanceHistory should compute attended flag correctly', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'b1',
        eventId: 'e1',
        status: 'CONFIRMED',
        event: {
          title: 'Past Event',
          date: new Date('2020-01-01'),
          status: 'COMPLETED',
        },
      },
      {
        id: 'b2',
        eventId: 'e2',
        status: 'PENDING',
        event: {
          title: 'Future Event',
          date: new Date('2100-01-01'),
          status: 'UPCOMING',
        },
      },
    ]);

    const history = await service.getAttendanceHistory('u1');
    expect(history[0].attended).toBe(true);
    expect(history[1].attended).toBe(false);
  });

  it('getPublicProfile should return user and mapped history', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'User',
      role: 'USER',
      avatar: null,
      bio: null,
      createdAt: new Date(),
    });
    prisma.booking.findMany.mockResolvedValue([
      {
        event: {
          date: new Date('2020-01-01'),
          status: 'COMPLETED',
        },
        status: 'CONFIRMED',
      },
    ]);

    const data = await service.getPublicProfile('u1');
    expect(data.user.id).toBe('u1');
    expect(data.history[0].attended).toBe(true);
  });
});
