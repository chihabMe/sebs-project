import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { type EventStatus } from '@sebs/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventsQueryDto } from './dto/events-query.dto';
import { MailService } from '../mail/mail.service';
import { DEFAULT_PAGE, PAGINATION_LIMITS } from '../common/constants/pagination.constants';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService, private mailService: MailService) {}

  async create(userId: string, userRole: string, dto: CreateEventDto, image?: string) {
    const { tags, ...restData } = dto;
    return this.prisma.event.create({
      data: {
        ...restData,
        date: new Date(dto.date),
        tags: {
          connect: tags?.map((id) => ({ id })) || []
        },
        image,
        organizerId: userId,
        isApproved: userRole === 'ADMIN',
      },
      include: {
        tags: true,
        organizer: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async findAll(query: EventsQueryDto) {
    const { search, category, date, tag, status, page, limit, organizerId } = query;
    const where: any = { isApproved: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { tags: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (category && category !== 'All Events') {
      where.category = category;
    }

    if (tag) {
      where.tags = { some: { id: tag } };
    }

    if (status) {
      where.status = status;
    }

    if (organizerId) {
      where.organizerId = organizerId;
    }

    if (date) {
      const filterDate = new Date(date);
      if (!isNaN(filterDate.getTime())) {
        const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
        where.date = { gte: startOfDay, lte: endOfDay };
      }
    }

    const args: any = {
      where,
      orderBy: { date: 'asc' },
      include: {
        organizer: { select: { id: true, name: true } },
        tags: true
      }
    };

    const safePage = page ?? DEFAULT_PAGE;
    const safeLimit = limit ?? PAGINATION_LIMITS.EVENTS_BROWSE;
    args.skip = (safePage - 1) * safeLimit;
    args.take = safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.event.findMany(args),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true } },
        tags: true
      }
    });
    if (!event) throw new NotFoundException('Event not found');
    if (!event.isApproved) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async findOneForManager(id: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true } },
        tags: true
      }
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to access this event');
    }
    return event;
  }

  async findOrganizerEvents(userId: string) {
    return this.prisma.event.findMany({
      where: { organizerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { tags: true }
    });
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateEventDto, image?: string) {
    const event = await this.findOneForManager(id, userId, userRole);
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to update this event');
    }

    const previousSnapshot = {
      date: new Date(event.date),
      location: event.location,
    };

    const { tags, ...restData } = dto;
    const updatedEvent = await this.prisma.event.update({
      where: { id: id },
      data: {
        ...restData,
        date: dto.date ? new Date(dto.date) : undefined,
        status: dto.status,
        tags: tags ? {
          set: tags.map((tagId) => ({ id: tagId }))
        } : undefined,
        image: image,
      },
      include: {
        tags: true,
        organizer: { select: { id: true, name: true } }
      }
    });

    const didDateChange = dto.date ? new Date(dto.date).getTime() !== previousSnapshot.date.getTime() : false;
    const didLocationChange = typeof dto.location === 'string' && dto.location !== previousSnapshot.location;

    if (didDateChange || didLocationChange) {
      const confirmedBookings = await this.prisma.booking.findMany({
        where: { eventId: id, status: 'CONFIRMED' },
        include: { user: true },
      });

      await Promise.all(
        confirmedBookings.map((booking: any) =>
          this.mailService.sendEventUpdated(booking.user, updatedEvent, previousSnapshot).catch(() => undefined),
        ),
      );
    }

    return updatedEvent;
  }

  async remove(id: string, userId: string, userRole: string) {
    const event = await this.findOneForManager(id, userId, userRole);
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to delete this event');
    }
    return this.prisma.event.delete({ where: { id } });
  }

  async updateStatus(id: string, status: EventStatus, userId: string, userRole: string) {
    const event = await this.findOneForManager(id, userId, userRole);
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Unauthorized to update this event');
    }
    return this.prisma.event.update({
      where: { id },
      data: { status: status as any }
    });
  }

  async getRecommended(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tags: true }
    });
    if (!user) throw new NotFoundException('User not found');

    const tagIds = user.tags.map(tag => tag.id);

    if (tagIds.length === 0) {
      return this.prisma.event.findMany({
        where: { isApproved: true, status: 'UPCOMING' },
        orderBy: { date: 'asc' },
        take: 10,
        include: { tags: true, organizer: { select: { id: true, name: true } } }
      });
    }

    return this.prisma.event.findMany({
      where: {
        isApproved: true,
        status: 'UPCOMING',
        tags: { some: { id: { in: tagIds } } }
      },
      orderBy: { date: 'asc' },
      take: 10,
      include: { tags: true, organizer: { select: { id: true, name: true } } }
    });
  }

}
