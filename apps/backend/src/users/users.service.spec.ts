import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    review: {
      deleteMany: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
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

    await service.updateProfile('u1', 'USER', { name: 'Updated', tags: ['t1'] });

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

  it('updateProfile should not accept password updates', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'Updated',
      role: 'USER',
      avatar: null,
      bio: 'Bio',
      tags: [],
    });

    await service.updateProfile('u1', 'USER', { name: 'Updated', password: 'IgnoredStrongPass123!' } as any);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          password: expect.anything(),
        }),
      }),
    );
  });

  it('updateProfile should reject tag updates for non-user roles', async () => {
    await expect(service.updateProfile('u1', 'ORGANIZER', { tags: ['t1'] })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.updateProfile('u1', 'ADMIN', { tags: ['t1'] })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('getAttendanceHistory should compute attendance states and stats correctly', async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'b1',
        eventId: 'e1',
        status: 'CONFIRMED',
        attended: true,
        event: {
          title: 'Past Event',
          date: new Date('2020-01-01'),
          status: 'COMPLETED',
        },
      },
      {
        id: 'b2',
        eventId: 'e2',
        status: 'CONFIRMED',
        attended: false,
        event: {
          title: 'Missed Event',
          date: new Date('2020-02-01'),
          status: 'COMPLETED',
        },
      },
      {
        id: 'b3',
        eventId: 'e3',
        status: 'CONFIRMED',
        attended: false,
        event: {
          title: 'Future Event',
          date: new Date('2100-01-01'),
          status: 'UPCOMING',
        },
      },
    ]);

    const data = await service.getAttendanceHistory('u1');
    expect(data.history[0].attended).toBe(true);
    expect(data.history[1].missed).toBe(true);
    expect(data.history[2].upcoming).toBe(true);
    expect(data.stats).toEqual({
      totalConfirmed: 3,
      attended: 1,
      missed: 1,
      upcoming: 1,
      attendanceRate: 50,
    });
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
          title: 'Past Event',
        },
        status: 'CONFIRMED',
        attended: true,
        id: 'b1',
        eventId: 'e1',
      },
    ]);

    const data = await service.getPublicProfile('u1');
    expect(data.user.id).toBe('u1');
    expect(data.history[0].attended).toBe(true);
    expect(data.stats.attended).toBe(1);
  });

  it('searchUsers should return USER/ORGANIZER records and following flags', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Self', role: 'USER', avatar: null, bio: null },
      { id: 'u2', name: 'Other User', role: 'USER', avatar: null, bio: 'Hello' },
      { id: 'o1', name: 'Organizer', role: 'ORGANIZER', avatar: null, bio: null },
    ]);
    prisma.follow.findMany.mockResolvedValue([{ followerId: 'u1', followingId: 'u2' }]);

    const results = await service.searchUsers('u1', 'other');
    expect(results.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'u2', isFollowing: true }),
        expect.objectContaining({ id: 'o1', isFollowing: false }),
      ]),
    );
    expect(results.meta.total).toBe(2);
  });

  it('followUser should create a relation for USER role', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', role: 'USER' });
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.follow.create.mockResolvedValue({ id: 'f1', followerId: 'u1', followingId: 'u2' });

    const result = await service.followUser('u1', 'USER', 'u2');
    expect(result.id).toBe('f1');
    expect(prisma.follow.create).toHaveBeenCalledWith({
      data: { followerId: 'u1', followingId: 'u2' },
    });
  });

  it('followUser should allow following organizer role', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'o1', role: 'ORGANIZER' });
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.follow.create.mockResolvedValue({ id: 'f2', followerId: 'u1', followingId: 'o1' });

    const result = await service.followUser('u1', 'USER', 'o1');
    expect(result.id).toBe('f2');
  });

  it('updateFollowBookingNotifications should update setting for USER role', async () => {
    prisma.user.update.mockResolvedValue({ id: 'u1', notifyFollowersOnBooking: true });

    const result = await service.updateFollowBookingNotifications('u1', 'USER', true);
    expect(result.notifyFollowersOnBooking).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { notifyFollowersOnBooking: true },
      select: { id: true, notifyFollowersOnBooking: true },
    });
  });

  it('getFollowing should return paginated list with meta', async () => {
    prisma.follow.findMany.mockResolvedValue([
      { followingId: 'u2', createdAt: new Date() },
      { followingId: 'o1', createdAt: new Date() },
    ]);
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u2', name: 'User 2', role: 'USER', avatar: null, bio: null })
      .mockResolvedValueOnce({ id: 'o1', name: 'Org 1', role: 'ORGANIZER', avatar: null, bio: null });

    const result = await service.getFollowing('u1', 1, 1);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(2);
    expect(result.meta.totalPages).toBe(2);
  });

  it('deleteProfile should reject non-user roles', async () => {
    await expect(service.deleteProfile('u1', 'ORGANIZER', 'password')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deleteProfile should reject invalid password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hashed-password' });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(service.deleteProfile('u1', 'USER', 'wrong-password')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('deleteProfile should remove reviews, bookings, and user when password is valid', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hashed-password' });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    prisma.review.deleteMany.mockResolvedValue({ count: 2 });
    prisma.booking.deleteMany.mockResolvedValue({ count: 3 });
    prisma.user.delete.mockResolvedValue({ id: 'u1' });
    prisma.$transaction.mockImplementation(async (ops: Promise<any>[]) => Promise.all(ops));

    await expect(service.deleteProfile('u1', 'USER', 'CurrentStrongPass123!')).resolves.toBeUndefined();
    expect(prisma.review.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.booking.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
