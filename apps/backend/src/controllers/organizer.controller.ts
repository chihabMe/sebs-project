import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';
import { ApiResponse } from '@sebs/shared';

export const getEventAttendees = async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const eventId = req.params.eventId as string;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    if (event.organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED_ACCESS');
    }

    const bookings = await prisma.booking.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        answers: { include: { question: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const bookingId = req.params.bookingId as string;
    const { status } = req.body; // CONFIRMED, REJECTED
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    if (booking.event.organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED_ACCESS');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { user: true, event: true },
    });

    res.json({ success: true, message: `Booking \${status.toLowerCase()} successfully`, data: updatedBooking });
  } catch (error) {
    next(error);
  }
};

export const removeAttendee = async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    if (booking.event.organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED_ACCESS');
    }

    await prisma.booking.delete({
      where: { id: bookingId },
    });

    res.json({ success: true, message: 'Attendee removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const generateInviteLink = async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const eventId = req.params.eventId as string;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    if (event.organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED_ACCESS');
    }

    // Ensure it has a token
    let token = event.invitationToken;
    if (!token) {
      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { invitationToken: crypto.randomUUID() },
      });
      token = updatedEvent.invitationToken;
    }

    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
};
