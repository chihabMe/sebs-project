import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TicketsService } from '../tickets/tickets.service';
import { CreateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private ticketsService: TicketsService,
  ) {}

  async create(userId: string, dto: CreateBookingDto, token?: string) {
    const { eventId, answers } = dto;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
        formQuestions: true,
      }
    });

    if (!event) throw new NotFoundException('Event not found');

    const isViaInvite = token && event.invitationToken === token;

    if (!isViaInvite && event.status !== 'UPCOMING') {
      throw new BadRequestException('Cannot book tickets for an event that is not upcoming');
    }

    if (event._count.bookings >= event.maxTickets) {
      throw new BadRequestException('Event is sold out');
    }

    // Validate form answers
    if (event.formQuestions.length > 0) {
      for (const question of event.formQuestions) {
        if (question.required) {
          const answer = answers?.find(a => a.questionId === question.id);
          if (!answer || !answer.answer) {
            throw new BadRequestException(`Answer for "${question.question}" is required`);
          }
        }
      }
    }

    const existingBooking = await this.prisma.booking.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    if (existingBooking) {
      if (existingBooking.status === 'CANCELLED' || existingBooking.status === 'REJECTED') {
        const updatedBooking = await this.prisma.booking.update({
          where: { id: existingBooking.id },
          data: { 
            status: isViaInvite ? 'CONFIRMED' : 'PENDING',
            answers: {
              deleteMany: {},
              create: answers?.map(a => ({
                questionId: a.questionId,
                answer: a.answer,
              }))
            }
          },
          include: { user: true, event: true }
        });
        
        if (updatedBooking.status === 'CONFIRMED') {
          this.mailService.sendBookingConfirmation(updatedBooking.user, updatedBooking.event).catch(console.error);
        }

        return updatedBooking;
      }
      throw new BadRequestException('You have already requested a ticket for this event');
    }

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        eventId,
        status: isViaInvite ? 'CONFIRMED' : 'PENDING',
        answers: {
          create: answers?.map(a => ({
            questionId: a.questionId,
            answer: a.answer,
          }))
        }
      },
      include: { user: true, event: true }
    });

    if (booking.status === 'CONFIRMED') {
      this.mailService.sendBookingConfirmation(booking.user, booking.event).catch(console.error);
    }

    return booking;
  }

  async findMy(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: true,
        answers: { include: { question: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTicket(id: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { event: true, user: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Unauthorized');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Ticket only available for confirmed bookings');
    }

    const pdfUrl = await this.ticketsService.generateTicketPDF(booking, booking.event, booking.user);
    return { url: pdfUrl };
  }

  async cancel(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Unauthorized');

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }

  async checkStatus(eventId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    return {
      id: booking?.id || null,
      isBooked: !!booking && booking.status !== 'CANCELLED' && booking.status !== 'REJECTED',
      status: booking?.status || null
    };
  }
}
