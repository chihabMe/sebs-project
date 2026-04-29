import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, type BookingStatus as BookingStatusType } from '@sebs/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AttendeesQueryDto } from './dto/attendees-query.dto';

@Injectable()
export class OrganizerService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async assertOrganizerEventAccess(eventId: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Unauthorized');
    return event;
  }

  async getOrganizerDashboardStats(userId: string) {
    const [events, totalBookings, pendingBookings, confirmedBookings, rejectedBookings, cancelledBookings] = await Promise.all([
      this.prisma.event.findMany({
        where: { organizerId: userId },
        select: {
          id: true,
          status: true,
          isApproved: true,
          maxTickets: true,
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.count({ where: { event: { organizerId: userId } } }),
      this.prisma.booking.count({ where: { event: { organizerId: userId }, status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { event: { organizerId: userId }, status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { event: { organizerId: userId }, status: BookingStatus.REJECTED } }),
      this.prisma.booking.count({ where: { event: { organizerId: userId }, status: BookingStatus.CANCELLED } }),
    ]);

    const stats = {
      totalEvents: events.length,
      approvedEvents: events.filter((event) => event.isApproved).length,
      pendingApprovalEvents: events.filter((event) => !event.isApproved).length,
      upcomingEvents: events.filter((event) => event.status === 'UPCOMING').length,
      ongoingEvents: events.filter((event) => event.status === 'ONGOING').length,
      completedEvents: events.filter((event) => event.status === 'COMPLETED').length,
      cancelledEvents: events.filter((event) => event.status === 'CANCELLED').length,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      rejectedBookings,
      cancelledBookings,
      totalCapacity: events.reduce((sum, event) => sum + event.maxTickets, 0),
      activeDemand: events.reduce((sum, event) => sum + event._count.bookings, 0),
      confirmationRate: totalBookings > 0 ? Number(((confirmedBookings / totalBookings) * 100).toFixed(2)) : 0,
    };

    return stats;
  }

  async getEventAttendees(eventId: string, userId: string, userRole: string, query: AttendeesQueryDto = {}) {
    await this.assertOrganizerEventAccess(eventId, userId, userRole);

    const where: any = { eventId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const args: any = {
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        answers: { include: { question: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [items, total, pending, confirmed, rejected, cancelled] = await Promise.all([
      this.prisma.booking.findMany(args),
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { eventId, status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { eventId, status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { eventId, status: BookingStatus.REJECTED } }),
      this.prisma.booking.count({ where: { eventId, status: BookingStatus.CANCELLED } }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        pending,
        confirmed,
        rejected,
        cancelled,
      },
    };
  }

  async updateBookingStatus(bookingId: string, status: BookingStatusType, userId: string, userRole: string) {
    if (status === BookingStatus.PENDING) {
      throw new BadRequestException('Invalid status transition');
    }
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.event.organizerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Unauthorized');

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status } as any,
      include: { user: true, event: true },
    });

    if (status === 'CONFIRMED') {
      this.mailService.sendBookingConfirmation(updatedBooking.user, updatedBooking.event).catch(console.error);
    }

    return updatedBooking;
  }

  async bulkUpdateBookingStatus(
    eventId: string,
    bookingIds: string[],
    status: BookingStatusType,
    userId: string,
    userRole: string,
  ) {
    await this.assertOrganizerEventAccess(eventId, userId, userRole);
    if (status === BookingStatus.PENDING) {
      throw new BadRequestException('Bulk status update does not allow PENDING status');
    }

    const uniqueBookingIds = [...new Set(bookingIds)].filter(Boolean);
    if (!uniqueBookingIds.length) return { updatedCount: 0 };

    const validBookings = await this.prisma.booking.findMany({
      where: {
        id: { in: uniqueBookingIds },
        eventId,
      },
      include: {
        user: true,
        event: true,
      },
    });

    if (!validBookings.length) return { updatedCount: 0 };

    const validIds = validBookings.map((booking) => booking.id);

    await this.prisma.booking.updateMany({
      where: { id: { in: validIds } },
      data: { status },
    });

    if (status === BookingStatus.CONFIRMED) {
      await Promise.all(
        validBookings.map((booking) =>
          this.mailService.sendBookingConfirmation(booking.user, booking.event).catch(() => undefined),
        ),
      );
    }

    return { updatedCount: validIds.length };
  }

  async removeAttendee(bookingId: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.event.organizerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Unauthorized');

    return this.prisma.booking.delete({ where: { id: bookingId } });
  }

  async bulkRemoveAttendees(eventId: string, bookingIds: string[], userId: string, userRole: string) {
    await this.assertOrganizerEventAccess(eventId, userId, userRole);

    const uniqueBookingIds = [...new Set(bookingIds)].filter(Boolean);
    if (!uniqueBookingIds.length) return { removedCount: 0 };

    const removed = await this.prisma.booking.deleteMany({
      where: {
        id: { in: uniqueBookingIds },
        eventId,
      },
    });

    return { removedCount: removed.count };
  }

  async generateInviteLink(eventId: string, userId: string, userRole: string) {
    const event = await this.assertOrganizerEventAccess(eventId, userId, userRole);

    let token = event.invitationToken;
    if (!token) {
      const updatedEvent = await this.prisma.event.update({
        where: { id: eventId },
        data: { invitationToken: crypto.randomUUID() },
      });
      token = updatedEvent.invitationToken;
    }

    return { token };
  }

  async rotateInviteLink(eventId: string, userId: string, userRole: string) {
    await this.assertOrganizerEventAccess(eventId, userId, userRole);
    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: { invitationToken: crypto.randomUUID() },
    });

    return { token: updatedEvent.invitationToken };
  }
}
