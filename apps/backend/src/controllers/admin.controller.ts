import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isBanned, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(isBanned !== undefined && { isBanned }),
        ...(role && { role }),
      },
    });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

export const getPendingEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      where: { isApproved: false },
      include: { organizer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

export const approveEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const event = await prisma.event.update({
      where: { id },
      data: { isApproved: true },
    });

    res.json({ success: true, message: 'Event approved successfully', data: event });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [userCount, eventCount, bookingCount, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.booking.count(),
      prisma.event.aggregate({ _sum: { price: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        totalEvents: eventCount,
        totalBookings: bookingCount,
        totalRevenue: totalRevenue._sum.price || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
