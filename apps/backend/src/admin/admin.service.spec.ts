import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
  } as any;

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(prisma);
  });

  it('createUser should normalize input and hash password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }: any) => ({
      id: 'u1',
      email: data.email,
      name: data.name,
      role: data.role,
    }));

    const created = await service.createUser({
      email: ' Test@Example.com ',
      password: 'StrongPass123!',
      name: ' Jane Doe ',
      role: undefined,
    });

    expect(created.email).toBe('test@example.com');
    expect(created.name).toBe('Jane Doe');
    expect(created.role).toBe('USER');
    const createCall = prisma.user.create.mock.calls[0][0];
    expect(createCall.data.password).not.toBe('StrongPass123!');
    expect(await bcrypt.compare('StrongPass123!', createCall.data.password)).toBe(true);
  });

  it('createUser should reject weak passwords', async () => {
    await expect(
      service.createUser({
        email: 'weak@example.com',
        password: 'password123',
        name: 'Jane',
        role: 'USER',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('createUser should reject duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

    await expect(
      service.createUser({
        email: 'user@example.com',
        password: 'StrongPass123!',
        name: 'Jane',
        role: 'USER',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateUser should only apply allowed fields', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'New Name',
      role: 'ORGANIZER',
      isBanned: true,
      createdAt: new Date(),
    });

    await service.updateUser('u1', {
      name: ' New Name ',
      role: 'ORGANIZER',
      isBanned: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: {
          name: 'New Name',
          role: 'ORGANIZER',
          isBanned: true,
        },
      }),
    );
  });

  it('getStats should aggregate summary metrics', async () => {
    prisma.user.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(10);
    prisma.event.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(6);
    prisma.booking.count.mockResolvedValue(30);
    prisma.event.aggregate.mockResolvedValue({ _sum: { price: 120 } });

    const stats = await service.getStats();
    expect(stats).toEqual({
      totalUsers: 10,
      totalEvents: 6,
      totalBookings: 30,
      totalRevenue: 120,
      pendingEvents: 6,
      bannedUsers: 10,
    });
  });

  it('rejectEvent should reject pending event and cancel it', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', isApproved: false });
    prisma.event.update.mockResolvedValue({ id: 'e1', isApproved: false, status: 'CANCELLED' });

    const updated = await service.rejectEvent('e1');

    expect(updated).toEqual({ id: 'e1', isApproved: false, status: 'CANCELLED' });
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { isApproved: false, status: 'CANCELLED' },
    });
  });

  it('rejectEvent should fail when event is already approved', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', isApproved: true });

    await expect(service.rejectEvent('e1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
