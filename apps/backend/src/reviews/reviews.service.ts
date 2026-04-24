import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const { eventId, rating, comment } = dto;

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const booking = await this.prisma.booking.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    if (!booking || booking.status !== 'CONFIRMED') {
      throw new BadRequestException('You must have a confirmed booking to review this event');
    }

    const existingReview = await this.prisma.review.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    if (existingReview) {
      return this.prisma.review.update({
        where: { id: existingReview.id },
        data: { rating, comment }
      });
    }

    return this.prisma.review.create({
      data: { rating, comment, userId, eventId }
    });
  }

  async findByEvent(eventId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { eventId },
      include: { user: { select: { name: true, id: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const aggregations = await this.prisma.review.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: { id: true }
    });

    return {
      reviews,
      stats: {
        averageRating: aggregations._avg?.rating || 0,
        totalReviews: aggregations._count?.id || 0
      }
    };
  }

  async remove(id: string, userId: string, userRole: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Unauthorized');
    }
    return this.prisma.review.delete({ where: { id } });
  }
}
