import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';
import { ReviewCreateInput, ApiResponse } from '@sebs/shared';

export const createReview = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { eventId, rating, comment } = req.body as ReviewCreateInput;
    const userId = req.user!.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    // Check if user has a confirmed booking
    const booking = await prisma.booking.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    if (!booking || booking.status !== 'CONFIRMED') {
      throw new AppError('You must have a confirmed booking to review this event', 400, 'INVALID_BOOKING_STATUS');
    }

    // Optional: Only allow reviews after event is completed
    // if (event.status !== 'COMPLETED') {
    //   throw new AppError('You can only review an event after it has been completed', 400);
    // }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    if (existingReview) {
      // Update existing
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating, comment }
      });

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      });
    }

    // Create new
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        eventId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const getEventReviews = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;

    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const aggregations = await prisma.review.aggregate({
      where: { eventId },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: aggregations._avg?.rating || 0,
          totalReviews: aggregations._count?.id || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new AppError('You are not authorized to delete this review', 403, 'UNAUTHORIZED_REVIEW_DELETE');
    }

    await prisma.review.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
