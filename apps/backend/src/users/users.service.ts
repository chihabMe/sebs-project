import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_PAGE, PAGINATION_LIMITS } from '../common/constants/pagination.constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapAttendanceHistory(bookings: any[]) {
    const history = bookings.map((booking) => {
      const eventDate = new Date(booking.event.date);
      const isPast = eventDate < new Date() || booking.event.status === 'COMPLETED';
      const isConfirmed = booking.status === 'CONFIRMED';
      const attended = isConfirmed && booking.attended === true;
      const missed = isConfirmed && isPast && !attended;
      const upcoming = isConfirmed && !isPast && !attended;

      return {
        id: booking.id,
        eventId: booking.eventId,
        title: booking.event.title,
        date: booking.event.date,
        bookingStatus: booking.status,
        eventStatus: booking.event.status,
        attended,
        missed,
        upcoming,
      };
    });

    const stats = {
      totalConfirmed: history.filter((item) => item.bookingStatus === 'CONFIRMED').length,
      attended: history.filter((item) => item.attended).length,
      missed: history.filter((item) => item.missed).length,
      upcoming: history.filter((item) => item.upcoming).length,
      attendanceRate: 0,
    };
    const completedTotal = stats.attended + stats.missed;
    stats.attendanceRate = completedTotal > 0 ? Math.round((stats.attended / completedTotal) * 100) : 0;

    return { history, stats };
  }

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
        notifyFollowersOnBooking: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, userRole: string, dto: UpdateProfileDto, avatarPath?: string) {
    const { tags, avatar, password: _password, ...restData } = dto as UpdateProfileDto & { password?: string };
    const rawNotifyFollowersOnBooking = (restData as any).notifyFollowersOnBooking;
    delete (restData as any).notifyFollowersOnBooking;
    if (tags && tags.length > 0 && userRole !== 'USER') {
      throw new ForbiddenException('Only normal users can update interests');
    }
    if (rawNotifyFollowersOnBooking !== undefined && userRole !== 'USER') {
      throw new ForbiddenException('Only normal users can update follow booking notifications');
    }
    const notifyFollowersOnBooking = rawNotifyFollowersOnBooking === undefined
      ? undefined
      : rawNotifyFollowersOnBooking === true || String(rawNotifyFollowersOnBooking).toLowerCase() === 'true';

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...restData,
        ...(notifyFollowersOnBooking !== undefined && { notifyFollowersOnBooking }),
        ...(avatarPath && { avatar: avatarPath }),
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
        notifyFollowersOnBooking: true,
      },
    });
  }

  async searchUsers(
    currentUserId: string,
    query?: string,
    page: number = DEFAULT_PAGE,
    limit: number = PAGINATION_LIMITS.USERS_SEARCH,
  ) {
    const rows = await this.prisma.user.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const follows = await this.prisma.follow.findMany({ where: { followerId: currentUserId } });
    const followingIds = new Set(follows.map((follow: any) => follow.followingId));

    const filtered = rows
      .filter((user: any) => user.id !== currentUserId && (user.role === 'USER' || user.role === 'ORGANIZER'))
      .map((user: any) => ({
        ...user,
        isFollowing: followingIds.has(user.id),
      }));

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const start = (safePage - 1) * safeLimit;
    const data = filtered.slice(start, start + safeLimit);

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  }

  async followUser(currentUserId: string, currentUserRole: string, targetUserId: string) {
    if (currentUserRole !== 'USER') {
      throw new ForbiddenException('Only normal users can follow others');
    }
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role !== 'USER' && target.role !== 'ORGANIZER') {
      throw new ForbiddenException('You can only follow users or organizers');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    });
    if (existing) return existing;

    return this.prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });
  }

  async unfollowUser(currentUserId: string, currentUserRole: string, targetUserId: string) {
    if (currentUserRole !== 'USER') {
      throw new ForbiddenException('Only normal users can unfollow others');
    }
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    });
    if (!existing) return;
    await this.prisma.follow.delete({ where: { id: existing.id } });
  }

  async updateFollowBookingNotifications(userId: string, userRole: string, notifyFollowersOnBooking: boolean) {
    if (userRole !== 'USER') {
      throw new ForbiddenException('Only normal users can update this setting');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { notifyFollowersOnBooking },
      select: {
        id: true,
        notifyFollowersOnBooking: true,
      },
    });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getFollowing(
    currentUserId: string,
    page: number = DEFAULT_PAGE,
    limit: number = PAGINATION_LIMITS.FOLLOWING,
  ) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      orderBy: { createdAt: 'desc' },
    });

    const following = await Promise.all(
      follows.map(async (follow: any) => {
        const user = await this.prisma.user.findUnique({
          where: { id: follow.followingId },
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            bio: true,
          },
        });
        return user;
      }),
    );

    const filtered = following.filter(Boolean);
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const start = (safePage - 1) * safeLimit;
    const data = filtered.slice(start, start + safeLimit);

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  }

  async getAttendanceHistory(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: { select: { title: true, date: true, status: true } }
      },
      orderBy: { event: { date: 'asc' } }
    });

    return this.mapAttendanceHistory(bookings);
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

    const attendance = this.mapAttendanceHistory(bookings);

    return { user, ...attendance };
  }

  async deleteProfile(userId: string, userRole: string, password: string) {
    if (userRole !== 'USER') {
      throw new ForbiddenException('Only normal users can delete their account from this route');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.$transaction([
      this.prisma.review.deleteMany({ where: { userId } }),
      this.prisma.booking.deleteMany({ where: { userId } }),
      this.prisma.follow.deleteMany({ where: { followerId: userId } }),
      this.prisma.follow.deleteMany({ where: { followingId: userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { actorId: userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}
