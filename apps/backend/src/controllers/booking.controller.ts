import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';
import { BookingCreateInput, ApiResponse } from '@sebs/shared';

export const createBooking = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { eventId } = req.body as BookingCreateInput;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { bookings: { where: { status: { not: 'CANCELLED' } } } } }
      }
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.status !== 'UPCOMING') {
      throw new AppError('Cannot book tickets for an event that is not upcoming', 400);
    }

    if (event._count.bookings >= event.maxTickets) {
      throw new AppError('Event is sold out', 400);
    }

    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    if (existingBooking) {
      if (existingBooking.status === 'CANCELLED') {
        // Re-activate booking
        const updatedBooking = await prisma.booking.update({
          where: { id: existingBooking.id },
          data: { status: 'CONFIRMED' }
        });
        
        return res.status(200).json({
          success: true,
          message: 'Booking successfully re-activated',
          data: updatedBooking
        });
      }
      throw new AppError('You have already booked a ticket for this event', 400);
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId,
        status: 'CONFIRMED' // Auto confirm for now, could be PENDING if payment is required
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            title: true,
            date: true,
            location: true,
            image: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.userId !== userId) {
      throw new AppError('You can only cancel your own bookings', 403);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Booking is already cancelled', 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

export const getEventBookings = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new AppError('You are not authorized to view bookings for this event', 403);
    }

    const bookings = await prisma.booking.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};
