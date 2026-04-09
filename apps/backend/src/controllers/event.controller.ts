import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { EventCreateInput, ApiResponse } from '@sebs/shared';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';

export const createEvent = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('User not found in request', 401);

    const eventData = req.body as EventCreateInput;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const event = await prisma.event.create({
      data: {
        ...eventData,
        image: imagePath,
        organizerId: userId,
        // If user is Admin, auto-approve. Otherwise, wait for approval.
        isApproved: req.user?.role === 'ADMIN', 
      },
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    // Basic filter: Only return approved events unless explicitly requested by an admin/organizer
    const events = await prisma.event.findMany({
      where: {
        isApproved: true,
      },
      orderBy: {
        date: 'asc',
      },
      include: {
        organizer: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true }
        }
      }
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};
