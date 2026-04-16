import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse, TagCreateInput } from '@sebs/shared';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middlewares/auth';

export const getAllTags = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can create tags', 403, 'FORBIDDEN');
    }

    const { name } = req.body as TagCreateInput;

    const existingTag = await prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      throw new AppError('Tag already exists', 400, 'TAG_EXISTS');
    }

    const tag = await prisma.tag.create({
      data: { name },
    });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can delete tags', 403, 'FORBIDDEN');
    }

    const id = req.params.id as string;

    await prisma.tag.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
