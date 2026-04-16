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
    if (!userId) throw new AppError('User not found in request', 401, 'USER_NOT_FOUND');

    const { tags, ...restData } = req.body as EventCreateInput;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const event = await prisma.event.create({
      data: {
        ...restData,
        tags: {
          connect: tags.map((id: string) => ({ id }))
        },
        image: imagePath,
        organizerId: userId,
        // If user is Admin, auto-approve. Otherwise, wait for approval.
        isApproved: req.user?.role === 'ADMIN', 
      },
      include: {
        tags: true,
        organizer: {
          select: { id: true, name: true }
        }
      }
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
    const { search, category, date, tag } = req.query;

    const where: any = {
      isApproved: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { 
          tags: {
            some: {
              name: { contains: search as string, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    if (category && category !== 'All Events') {
      where.category = category as string;
    }

    if (tag) {
      where.tags = {
        some: {
          id: tag as string
        }
      };
    }

    if (date) {
      // Basic date filtering logic - can be expanded
      const filterDate = new Date(date as string);
      if (!isNaN(filterDate.getTime())) {
        const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
        where.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
      include: {
        organizer: {
          select: { id: true, name: true }
        },
        tags: true
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
        },
        tags: true
      }
    });

    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizerEvents = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const events = await prisma.event.findMany({
      where: {
        organizerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tags: true,
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

export const updateEvent = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new AppError('You are not authorized to update this event', 403, 'UNAUTHORIZED_EVENT_UPDATE');
    }

    const { tags, ...restData } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    console.log('Updating event with data:', restData);
    if (imagePath) console.log('New image uploaded:', imagePath);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...restData,
        ...(tags && {
          tags: {
            set: tags.map((id: string) => ({ id }))
          }
        }),
        ...(imagePath && { image: imagePath }),
      },
      include: {
        tags: true,
        organizer: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new AppError('You are not authorized to delete this event', 403, 'UNAUTHORIZED_EVENT_DELETE');
    }

    await prisma.event.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateEventStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new AppError('Unauthorized to update this event', 403, 'UNAUTHORIZED_EVENT_STATUS_UPDATE');
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ success: true, message: 'Event status updated', data: updatedEvent });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedEvents = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('User not found', 401, 'USER_NOT_FOUND');

    // Get user tags
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tags: true }
    });

    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const tagIds = user.tags.map(tag => tag.id);

    // If user has no tags, return upcoming events
    if (tagIds.length === 0) {
      const events = await prisma.event.findMany({
        where: { isApproved: true, status: 'UPCOMING' },
        orderBy: { date: 'asc' },
        take: 10,
        include: { tags: true, organizer: { select: { id: true, name: true } } }
      });
      return res.status(200).json({ success: true, data: events });
    }

    // Find events that have at least one of user tags
    const recommended = await prisma.event.findMany({
      where: {
        isApproved: true,
        status: 'UPCOMING',
        tags: {
          some: {
            id: { in: tagIds }
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 10,
      include: { tags: true, organizer: { select: { id: true, name: true } } }
    });

    res.status(200).json({
      success: true,
      data: recommended,
    });
  } catch (error) {
    next(error);
  }
};
