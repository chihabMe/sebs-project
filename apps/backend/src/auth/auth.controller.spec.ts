import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getAuthenticatedUser: jest.fn(),
  } as any;

  let controller: AuthController;

  const createRes = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService);
  });

  it('register should set tokens in httpOnly cookies and return payload', async () => {
    authService.register.mockResolvedValue({
      user: { id: 'u1', email: 'user@example.com', name: 'User', role: 'USER', avatar: null, bio: null },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const res = createRes();

    await controller.register({ email: 'user@example.com', password: 'password123', name: 'User' }, res);

    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.cookie.mock.calls[0][0]).toBe('accessToken');
    expect(res.cookie.mock.calls[1][0]).toBe('refreshToken');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('logout should clear auth cookies', async () => {
    const res = createRes();
    await controller.logout(res);

    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({ httpOnly: true }));
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ httpOnly: true }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('adminLogin should reject non-admin users', async () => {
    authService.login.mockResolvedValue({
      user: { id: 'u1', email: 'user@example.com', name: 'User', role: 'USER', avatar: null, bio: null, tags: [] },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    await expect(
      controller.adminLogin({ email: 'user@example.com', password: 'password123' }, createRes()),
    ).rejects.toThrow('Administrator access required');
  });

  it('forgotPassword should return a generic success message', async () => {
    authService.forgotPassword.mockResolvedValue(undefined);

    await expect(controller.forgotPassword({ email: 'user@example.com' })).resolves.toEqual({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    });

    expect(authService.forgotPassword).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('resetPassword should clear auth cookies and return success', async () => {
    authService.resetPassword.mockResolvedValue(undefined);
    const res = createRes();

    await controller.resetPassword({ token: 'reset-token', password: 'newPassword123' }, res);

    expect(authService.resetPassword).toHaveBeenCalledWith({ token: 'reset-token', password: 'newPassword123' });
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({ httpOnly: true }));
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ httpOnly: true }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  });

  it('adminSession should return admin session payload', async () => {
    authService.getAuthenticatedUser.mockResolvedValue({
      id: 'a1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      avatar: null,
      bio: null,
      tags: [],
    });

    await expect(controller.adminSession({ id: 'a1', role: 'ADMIN' })).resolves.toEqual({
      success: true,
      data: {
        user: expect.objectContaining({ id: 'a1', role: 'ADMIN' }),
        portal: 'admin',
      },
    });
  });
});
