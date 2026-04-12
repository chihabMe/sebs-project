import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { RegisterInput, LoginInput, AuthResponse, ApiResponse } from '@sebs/shared';
import { AppError } from '../utils/AppError';

const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'supersecretfallback', { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'refreshsecretfallback', { expiresIn: '7d' });
};

const setTokensInCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response<ApiResponse<AuthResponse>>,
  next: NextFunction
) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already in use', 400, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
      },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    setTokensInCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response<ApiResponse<AuthResponse>>,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (user.isBanned) {
      throw new AppError('Your account has been banned', 403, 'ACCOUNT_BANNED');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    setTokensInCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new AppError('No refresh token provided', 401, 'MISSING_REFRESH_TOKEN');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshsecretfallback') as { id: string };
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }
    if (user.isBanned) {
      throw new AppError('Your account has been banned', 403, 'ACCOUNT_BANNED');
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    setTokensInCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { token: accessToken }
    });
  } catch (error) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    next(new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN'));
  }
};

export const logout = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
