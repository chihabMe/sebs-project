import { UsersController } from './users.controller';

describe('UsersController', () => {
  const usersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getAttendanceHistory: jest.fn(),
    getPublicProfile: jest.fn(),
  } as any;

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService);
  });

  it('getProfile should return success payload', async () => {
    usersService.getProfile.mockResolvedValue({ id: 'u1', email: 'user@example.com' });
    const response = await controller.getProfile('u1');
    expect(response.success).toBe(true);
    expect(response.data.id).toBe('u1');
  });

  it('updateProfile should return success payload with message', async () => {
    usersService.updateProfile.mockResolvedValue({ id: 'u1', name: 'Updated' });
    const response = await controller.updateProfile('u1', { name: 'Updated' });
    expect(response.success).toBe(true);
    expect(response.message).toContain('Profile updated');
  });

  it('getAttendanceHistory should return mapped data', async () => {
    usersService.getAttendanceHistory.mockResolvedValue([{ id: 'b1', attended: true }]);
    const response = await controller.getAttendanceHistory('u1');
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  it('getPublicProfile should return public data', async () => {
    usersService.getPublicProfile.mockResolvedValue({ user: { id: 'u1' }, history: [] });
    const response = await controller.getPublicProfile('u1');
    expect(response.success).toBe(true);
    expect(response.data.user.id).toBe('u1');
  });
});
