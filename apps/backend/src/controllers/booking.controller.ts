import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';
import { BookingCreateInput, ApiResponse } from '@sebs/shared';
import { generateTicketPDF } from '../services/ticket.service';
import { sendBookingConfirmation } from '../services/email.service';

export const createBooking = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { eventId, answers } = req.body as BookingCreateInput;
    const { token } = req.query; // Invitation token if provided
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
        formQuestions: true,
      }
    });

    if (!event) throw new AppError('Event not found', 404);

    // Validate invitation token if event is private (future proofing) or just check token
    const isViaInvite = token && event.invitationToken === token;

    if (!isViaInvite && event.status !== 'UPCOMING') {
      throw new AppError('Cannot book tickets for an event that is not upcoming', 400);
    }

    if (event._count.bookings >= event.maxTickets) {
      throw new AppError('Event is sold out', 400);
    }

    // Validate form answers
    if (event.formQuestions.length > 0) {
      for (const question of event.formQuestions) {
        if (question.required) {
          const answer = answers?.find(a => a.questionId === question.id);
          if (!answer || !answer.answer) {
            throw new AppError(\`Answer for "\${question.question}" is required\`, 400);
          }
        }
      }
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    if (existingBooking) {
      if (existingBooking.status === 'CANCELLED' || existingBooking.status === 'REJECTED') {
        // Re-open booking
        const updatedBooking = await prisma.booking.update({
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
          sendBookingConfirmation(updatedBooking.user, updatedBooking.event).catch(console.error);
        }

        return res.status(200).json({
          success: true,
          message: isViaInvite ? 'Booking confirmed via invite' : 'Booking request sent',
          data: updatedBooking
        });
      }
      throw new AppError('You have already requested a ticket for this event', 400);
    }

    const booking = await prisma.booking.create({
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
      sendBookingConfirmation(booking.user, booking.event).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: booking.status === 'CONFIRMED' ? 'Booking confirmed' : 'Booking request submitted',
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
        event: true,
        answers: { include: { question: true } }
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

export const downloadTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
      },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }
    if (booking.status !== 'CONFIRMED') {
      throw new AppError('Ticket only available for confirmed bookings', 400);
    }

    const pdfUrl = await generateTicketPDF(booking, booking.event, booking.user);
    res.json({ success: true, data: { url: pdfUrl } });
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

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== userId) throw new AppError('Unauthorized', 403);

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

export const checkBookingStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });

    res.status(200).json({
      success: true,
      data: {
        isBooked: !!booking && booking.status !== 'CANCELLED' && booking.status !== 'REJECTED',
        status: booking?.status || null
      }
    });
  } catch (error) {
    next(error);
  }
};
