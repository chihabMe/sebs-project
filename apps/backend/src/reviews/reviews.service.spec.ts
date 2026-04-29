import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const prisma = {
    event: { findUnique: jest.fn() },
    booking: { findUnique: jest.fn() },
    review: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      delete: jest.fn(),
    },
  } as any;

  let service: ReviewsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReviewsService(prisma);
  });

  it('create should reject when event does not exist', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(
      service.create('u1', { eventId: 'e1', rating: 5, comment: 'Great' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create should reject without confirmed booking', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1' });
    prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'PENDING' });

    await expect(
      service.create('u1', { eventId: 'e1', rating: 4, comment: 'Nice' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create should update existing review', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1' });
    prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'CONFIRMED' });
    prisma.review.findUnique.mockResolvedValue({ id: 'r1' });
    prisma.review.update.mockResolvedValue({ id: 'r1', rating: 3, comment: 'Updated' });

    const result = await service.create('u1', { eventId: 'e1', rating: 3, comment: 'Updated' });
    expect(result.id).toBe('r1');
    expect(prisma.review.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { rating: 3, comment: 'Updated' },
    });
  });

  it('remove should reject when non-owner non-admin deletes review', async () => {
    prisma.review.findUnique.mockResolvedValue({ id: 'r1', userId: 'owner-id' });

    await expect(service.remove('r1', 'other-user', 'USER')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
