import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(query: any) {
    const { search, category, date, tag } = query;
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

    if (date) {
      const filterDate = new Date(date);
      if (!isNaN(filterDate.getTime())) {
        const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
        where.date = { gte: startOfDay, lte: endOfDay };
      }
    }

    return this.prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        organizer: { select: { id: true, name: true } },
        tags: true
      }
    });
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
    const event = await this.findOne(id);
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to update this event');
    }

    const { tags, ...restData } = dto;
    return this.prisma.event.update({
      where: { id: id },
      data: {
        ...restData,
        date: dto.date ? new Date(dto.date) : undefined,
        status: dto.status as any,
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
  }

  async remove(id: string, userId: string, userRole: string) {
    const event = await this.findOne(id);
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to delete this event');
    }
    return this.prisma.event.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string, userId: string, userRole: string) {
    const event = await this.findOne(id);
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
