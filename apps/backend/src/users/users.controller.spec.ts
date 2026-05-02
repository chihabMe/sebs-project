import { UsersController } from './users.controller';

describe('UsersController', () => {
  const usersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getAttendanceHistory: jest.fn(),
    getPublicProfile: jest.fn(),
    searchUsers: jest.fn(),
    getFollowing: jest.fn(),
  } as any;
  const cloudinaryService = {
    uploadImage: jest.fn(),
  } as any;

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService, cloudinaryService);
  });

  it('getProfile should return success payload', async () => {
    usersService.getProfile.mockResolvedValue({ id: 'u1', email: 'user@example.com' });
    const response = await controller.getProfile('u1');
    expect(response.success).toBe(true);
    expect(response.data.id).toBe('u1');
  });

  it('updateProfile should return success payload with message', async () => {
    usersService.updateProfile.mockResolvedValue({ id: 'u1', name: 'Updated' });
    const response = await controller.updateProfile('u1', 'USER', { name: 'Updated' });
    expect(response.success).toBe(true);
    expect(response.message).toContain('Profile updated');
    expect(usersService.updateProfile).toHaveBeenCalledWith('u1', 'USER', { name: 'Updated' }, undefined);
  });

  it('getAttendanceHistory should return mapped data', async () => {
    usersService.getAttendanceHistory.mockResolvedValue({
      history: [{ id: 'b1', attended: true }],
      stats: { attended: 1, missed: 0, upcoming: 0, totalConfirmed: 1, attendanceRate: 100 },
    });
    const response = await controller.getAttendanceHistory('u1');
    expect(response.success).toBe(true);
    expect(response.data.history).toHaveLength(1);
    expect(response.data.stats.attended).toBe(1);
  });

  it('getPublicProfile should return public data', async () => {
    usersService.getPublicProfile.mockResolvedValue({
      user: { id: 'u1' },
      history: [],
      stats: { attended: 0, missed: 0, upcoming: 0, totalConfirmed: 0, attendanceRate: 0 },
    });
    const response = await controller.getPublicProfile('u1');
    expect(response.success).toBe(true);
    expect(response.data.user.id).toBe('u1');
    expect(response.data.stats.totalConfirmed).toBe(0);
  });

  it('searchUsers should return paginated payload', async () => {
    usersService.searchUsers.mockResolvedValue({
      data: [{ id: 'u2' }],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
    const response = await controller.searchUsers('u1', { query: 'u', page: 1, limit: 12 } as any);
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
    expect(response.meta.total).toBe(1);
  });

  it('getFollowing should return paginated payload', async () => {
    usersService.getFollowing.mockResolvedValue({
      data: [{ id: 'u2' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    const response = await controller.getFollowing('u1', { page: 1, limit: 10 } as any);
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
    expect(response.meta.totalPages).toBe(1);
  });
});
