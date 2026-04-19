import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';
import { ApiResponse, EventFormUpdateInput } from '@sebs/shared';

export const getEventForm = async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const eventId = req.params.eventId as string;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');

    const questions = await prisma.eventFormQuestion.findMany({
      where: { eventId },
    });

    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

export const updateEventForm = async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const eventId = req.params.eventId as string;
    const { questions } = req.body as EventFormUpdateInput;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    if (event.organizerId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED_ACCESS');
    }

    // Replace all questions for simplicity (or use more complex logic)
    await prisma.$transaction([
      prisma.eventFormQuestion.deleteMany({ where: { eventId } }),
      prisma.eventFormQuestion.createMany({
        data: questions.map(q => ({
          ...q,
          eventId,
        })),
      }),
    ]);

    const updatedQuestions = await prisma.eventFormQuestion.findMany({
      where: { eventId },
    });

    res.json({ success: true, message: 'Event form updated successfully', data: updatedQuestions });
  } catch (error) {
    next(error);
  }
};
