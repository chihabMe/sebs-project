import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrganizerService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getEventAttendees(eventId: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Unauthorized');

    return this.prisma.booking.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        answers: { include: { question: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBookingStatus(bookingId: string, status: string, userId: string, userRole: string) {
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

  async removeAttendee(bookingId: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.event.organizerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Unauthorized');

    return this.prisma.booking.delete({ where: { id: bookingId } });
  }

  async generateInviteLink(eventId: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Unauthorized');

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
}
