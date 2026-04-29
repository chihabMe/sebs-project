import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as any;

  const configService = {
    get: jest.fn(() => 'jwt-secret'),
  } as any;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as any;

  let guard: AuthGuard;

  const createContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(jwtService, configService, prisma);
  });

  it('should authorize valid bearer token', async () => {
    const request: any = { headers: { authorization: 'Bearer token' }, cookies: {} };
    jwtService.verifyAsync.mockResolvedValue({ id: 'u1', role: 'USER' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'USER', isBanned: false });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1', role: 'USER' });
  });

  it('should authorize valid cookie token', async () => {
    const request: any = { headers: {}, cookies: { accessToken: 'cookie-token' } };
    jwtService.verifyAsync.mockResolvedValue({ id: 'u2', role: 'ADMIN' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', role: 'ADMIN', isBanned: false });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u2', role: 'ADMIN' });
  });

  it('should reject banned user', async () => {
    const request = { headers: { authorization: 'Bearer token' }, cookies: {} };
    jwtService.verifyAsync.mockResolvedValue({ id: 'u1', role: 'USER' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'USER', isBanned: true });

    await expect(guard.canActivate(createContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject missing token', async () => {
    const request = { headers: {}, cookies: {} };

    await expect(guard.canActivate(createContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
