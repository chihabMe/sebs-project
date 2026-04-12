import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Try to extract token from HttpOnly cookie
    let token = req.cookies?.accessToken;

    // 2. Fallback to Authorization header if cookies aren't used (e.g. CLI, Postman testing without cookie jar)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authenticated. Please log in.', 401, 'MISSING_AUTH_TOKEN');
    }

    const secret = process.env.JWT_SECRET || 'supersecretfallback';
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    req.user = decoded;
    
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'INSUFFICIENT_PERMISSIONS'));
    }
    next();
  };
};
