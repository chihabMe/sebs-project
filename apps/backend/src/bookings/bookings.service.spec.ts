import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  const prisma = {
    event: { findUnique: jest.fn() },
    booking: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  } as any;
  const mailService = {
    sendBookingRequestReceived: jest.fn().mockResolvedValue(true),
    sendBookingConfirmation: jest.fn().mockResolvedValue(true),
  } as any;
  const ticketsService = { generateTicketPDF: jest.fn().mockResolvedValue('/uploads/tickets/t1.pdf') } as any;

  let service: BookingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingsService(prisma, mailService, ticketsService);
  });

  it('create should reject missing event', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(
      service.create('u1', 'USER', { eventId: 'e1', answers: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create should reject non-user roles', async () => {
    await expect(
      service.create('u1', 'ADMIN', { eventId: 'e1', answers: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('create should reject unapproved events', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'e1',
      isApproved: false,
      status: 'UPCOMING',
      invitationToken: 'token',
      maxTickets: 10,
      _count: { bookings: 0 },
      formQuestions: [],
    });

    await expect(
      service.create('u1', 'USER', { eventId: 'e1', answers: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create should reject sold out event', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'e1',
      isApproved: true,
      status: 'UPCOMING',
      invitationToken: 'token',
      maxTickets: 10,
      _count: { bookings: 10 },
      formQuestions: [],
    });

    await expect(
      service.create('u1', 'USER', { eventId: 'e1', answers: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create should confirm invited booking when token matches', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'e1',
      isApproved: true,
      status: 'CANCELLED',
      invitationToken: 'invite-token',
      maxTickets: 10,
      _count: { bookings: 0 },
      formQuestions: [],
    });
    prisma.booking.findUnique.mockResolvedValue(null);
    prisma.booking.create.mockResolvedValue({
      id: 'b1',
      status: 'CONFIRMED',
      user: { id: 'u1', email: 'u@example.com', name: 'User' },
      event: { id: 'e1', title: 'Event', date: new Date(), location: 'Online' },
    });

    const booking = await service.create('u1', 'USER', { eventId: 'e1', answers: [] }, 'invite-token');
    expect(booking.status).toBe('CONFIRMED');
    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      }),
    );
  });

  it('getTicket should reject non-owner non-admin', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'CONFIRMED',
      userId: 'owner-id',
      user: { id: 'owner-id', name: 'Owner', email: 'owner@example.com' },
      event: { id: 'e1', title: 'Event', date: new Date(), location: 'Online' },
    });

    await expect(service.getTicket('b1', 'other-user', 'USER')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getTicket should return URL for owner confirmed booking', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'CONFIRMED',
      userId: 'u1',
      user: { id: 'u1', name: 'User', email: 'u@example.com' },
      event: { id: 'e1', title: 'Event', date: new Date(), location: 'Online' },
    });

    const ticket = await service.getTicket('b1', 'u1', 'USER');
    expect(ticket).toEqual({ url: '/uploads/tickets/t1.pdf' });
    expect(ticketsService.generateTicketPDF).toHaveBeenCalled();
  });

  it('checkStatus should map booking to user-facing status payload', async () => {
    prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'PENDING' });

    const result = await service.checkStatus('e1', 'u1');
    expect(result).toEqual({
      id: 'b1',
      isBooked: true,
      status: 'PENDING',
    });
  });
});
