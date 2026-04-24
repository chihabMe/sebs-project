import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        tags: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { tags, ...restData } = dto;
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...restData,
        ...(tags && {
          tags: {
            set: tags.map((id) => ({ id }))
          }
        })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        tags: true,
      },
    });
  }

  async getAttendanceHistory(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: { select: { title: true, date: true, status: true } }
      },
      orderBy: { event: { date: 'asc' } }
    });

    return bookings.map(b => {
      const isPast = new Date(b.event.date) < new Date() || b.event.status === 'COMPLETED';
      const attended = b.status === 'CONFIRMED' && isPast;

      return {
        id: b.id,
        eventId: b.eventId,
        title: b.event.title,
        date: b.event.date,
        bookingStatus: b.status,
        eventStatus: b.event.status,
        attended
      };
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: { select: { title: true, date: true, status: true } }
      },
      orderBy: { event: { date: 'asc' } }
    });

    const history = bookings.map(b => {
      const isPast = new Date(b.event.date) < new Date() || b.event.status === 'COMPLETED';
      const attended = b.status === 'CONFIRMED' && isPast;

      return { date: b.event.date, attended };
    });

    return { user, history };
  }
}
