import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '@sebs/shared';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Generate a unique error ID for tracking
const generateErrorId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const errorId = generateErrorId();
  
  // Log error with context
  logger.error('Unhandled error occurred', {
    errorId,
    method: req.method,
    url: req.url,
    userId: (req as any).user?.id || null,
    userAgent: req.get('User-Agent'),
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';
    
    switch (err.code) {
      case 'P2002':
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
        break;
      case 'P2025':
        message = 'Resource not found';
        code = 'RESOURCE_NOT_FOUND';
        break;
      default:
        message = 'Database operation failed';
    }
    
    logger.error('Prisma error', {
      errorId,
      code: err.code,
      meta: err.meta
    });
    
    return res.status(400).json({
      success: false,
      message,
      errorId,
      code,
      details: process.env.NODE_ENV === 'development' ? { 
        prismaCode: err.code,
        meta: err.meta 
      } : undefined
    });
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', {
      errorId,
      message: err.message
    });
    
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided',
      errorId,
      code: 'VALIDATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? { 
        error: err.message 
      } : undefined
    });
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    // Log operational errors as warnings since they're expected
    if (err.isOperational) {
      logger.warn('Operational error', {
        errorId,
        code: err.code,
        message: err.message,
        details: err.details
      });
    } else {
      // Log programming errors as errors since they indicate bugs
      logger.error('Programming error', {
        errorId,
        code: err.code,
        message: err.message,
        details: err.details
      });
    }
    
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorId,
      code: err.code,
      details: err.details
    });
  }

  // Handle generic errors
  logger.error('Unexpected error', {
    errorId,
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errorId,
    code: 'INTERNAL_ERROR'
  });
};
