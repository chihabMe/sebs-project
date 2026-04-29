import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

describe('AuthService password reset', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_PUBLIC_URL') return 'https://eventify.test';
      return undefined;
    }),
  };
  const mailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as any, jwtService as any, configService as any, mailService as any);
  });

  it('forgotPassword does not reveal unknown emails', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.forgotPassword({ email: 'missing@example.com' })).resolves.toBeUndefined();

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('forgotPassword does not send reset emails for banned users', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'banned@example.com',
      name: 'Banned',
      isBanned: true,
    });

    await expect(service.forgotPassword({ email: 'banned@example.com' })).resolves.toBeUndefined();

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('forgotPassword stores only a hashed reset token and sends a link', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      isBanned: false,
    });
    prisma.user.update.mockResolvedValue({});

    await service.forgotPassword({ email: 'USER@example.com' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: expect.objectContaining({
        passwordResetTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        passwordResetExpiresAt: expect.any(Date),
        passwordResetRequestedAt: expect.any(Date),
      }),
    });
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      expect.stringMatching(/^https:\/\/eventify\.test\/reset-password\?token=/),
    );
  });

  it('resetPassword rejects invalid or expired tokens', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      passwordResetExpiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.resetPassword({ token: 'expired', password: 'newPassword123' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('resetPassword updates password and clears reset fields', async () => {
    const token = 'raw-token';
    const bcrypt = await import('bcryptjs');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-new-password' as never);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    });
    prisma.user.update.mockResolvedValue({});

    await service.resetPassword({ token, password: 'newPassword123' });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { passwordResetTokenHash: hashToken(token) } });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: expect.objectContaining({
        password: 'hashed-new-password',
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
      }),
    });
  });
});
