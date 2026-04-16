import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { updateProfileSchema } from '@sebs/shared';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED_ACCESS');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        tags: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED_ACCESS');
    }

    const { tags, ...restData } = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...restData,
        ...(tags && {
          tags: {
            set: tags.map((id: string) => ({ id }))
          }
        })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        tags: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED_ACCESS');

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          select: { title: true, date: true, status: true }
        }
      },
      orderBy: { event: { date: 'asc' } }
    });

    const history = bookings.map(b => {
      const isPast = new Date(b.event.date) < new Date() || b.event.status === 'COMPLETED';
      const attended = b.status === 'CONFIRMED' && isPast;

      return {
        id: b.id,
        eventId: b.eventId,
        title: b.event.title,
        date: b.event.date,
        bookingStatus: b.status,
        eventStatus: b.event.status,
        attended
      };
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          select: { title: true, date: true, status: true }
        }
      },
      orderBy: { event: { date: 'asc' } }
    });

    const history = bookings.map(b => {
      const isPast = new Date(b.event.date) < new Date() || b.event.status === 'COMPLETED';
      const attended = b.status === 'CONFIRMED' && isPast;

      return {
        date: b.event.date,
        attended
      };
    });

    res.json({
      success: true,
      data: { user, history }
    });
  } catch (error) {
    next(error);
  }
};
