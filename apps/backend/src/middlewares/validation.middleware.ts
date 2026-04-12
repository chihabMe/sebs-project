import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      next(new AppError(
        'Validation failed', 
        400, 
        'VALIDATION_ERROR',
        { 
          fieldErrors: error.errors?.map((e: any) => ({
            path: e.path,
            message: e.message
          })) || []
        }
      ));
    }
  };
};