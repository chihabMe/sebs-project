import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewsQueryDto } from './dto/reviews-query.dto';

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

    if (!booking || booking.status !== 'CONFIRMED' || (!booking.attended && event.status !== 'COMPLETED' && new Date(event.date) >= new Date())) {
      throw new BadRequestException('You must have attended the event to review it');
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

  async findByEvent(eventId: string, query: ReviewsQueryDto = {}) {
    const where: any = { eventId };

    if (typeof query.minRating === 'number' || typeof query.maxRating === 'number') {
      where.rating = {
        ...(typeof query.minRating === 'number' ? { gte: query.minRating } : {}),
        ...(typeof query.maxRating === 'number' ? { lte: query.maxRating } : {}),
      };
    }

    if (query.search) {
      where.comment = { contains: query.search, mode: 'insensitive' };
    }

    const args: any = {
      where,
      include: { user: { select: { name: true, id: true } } },
      orderBy: { createdAt: 'desc' }
    };

    if (query.page && query.limit) {
      args.skip = (query.page - 1) * query.limit;
      args.take = query.limit;
    }

    const reviews = await this.prisma.review.findMany(args);

    const aggregations = await this.prisma.review.aggregate({
      where,
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
