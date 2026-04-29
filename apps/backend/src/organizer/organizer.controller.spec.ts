import { OrganizerController } from './organizer.controller';

describe('OrganizerController', () => {
  const organizerService = {
    getOrganizerDashboardStats: jest.fn(),
    getEventAttendees: jest.fn(),
    updateBookingStatus: jest.fn(),
    bulkUpdateBookingStatus: jest.fn(),
    removeAttendee: jest.fn(),
    bulkRemoveAttendees: jest.fn(),
    generateInviteLink: jest.fn(),
    rotateInviteLink: jest.fn(),
  } as any;

  let controller: OrganizerController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new OrganizerController(organizerService);
  });

  it('getDashboardStats should return stats payload', async () => {
    organizerService.getOrganizerDashboardStats.mockResolvedValue({ totalEvents: 4 });
    const response = await controller.getDashboardStats('u1');
    expect(response.success).toBe(true);
    expect(response.data.totalEvents).toBe(4);
  });

  it('getEventAttendees should return attendees payload', async () => {
    organizerService.getEventAttendees.mockResolvedValue({ items: [{ id: 'b1' }], meta: { total: 1 } });
    const response = await controller.getEventAttendees('e1', 'u1', 'ORGANIZER', {});
    expect(response.success).toBe(true);
    expect(response.data.items).toHaveLength(1);
  });

  it('updateBookingStatus should return success message', async () => {
    organizerService.updateBookingStatus.mockResolvedValue({ id: 'b1', status: 'CONFIRMED' });
    const response = await controller.updateBookingStatus(
      'b1',
      { status: 'CONFIRMED' as any },
      'u1',
      'ORGANIZER',
    );
    expect(response.success).toBe(true);
    expect(response.message).toContain('confirmed');
  });

  it('removeAttendee should return success message', async () => {
    organizerService.removeAttendee.mockResolvedValue(undefined);
    const response = await controller.removeAttendee('b1', 'u1', 'ORGANIZER');
    expect(response.success).toBe(true);
  });

  it('bulkUpdateBookingStatuses should return success payload', async () => {
    organizerService.bulkUpdateBookingStatus.mockResolvedValue({ updatedCount: 2 });
    const response = await controller.bulkUpdateBookingStatuses(
      'e1',
      { bookingIds: ['b1', 'b2'], status: 'CONFIRMED' as any },
      'u1',
      'ORGANIZER',
    );
    expect(response.success).toBe(true);
    expect(response.data.updatedCount).toBe(2);
  });

  it('bulkRemoveAttendees should return success payload', async () => {
    organizerService.bulkRemoveAttendees.mockResolvedValue({ removedCount: 2 });
    const response = await controller.bulkRemoveAttendees('e1', { bookingIds: ['b1', 'b2'] }, 'u1', 'ORGANIZER');
    expect(response.success).toBe(true);
    expect(response.data.removedCount).toBe(2);
  });

  it('generateInviteLink should return token payload', async () => {
    organizerService.generateInviteLink.mockResolvedValue({ token: 'invite-token' });
    const response = await controller.generateInviteLink('e1', 'u1', 'ORGANIZER');
    expect(response.success).toBe(true);
    expect(response.data.token).toBe('invite-token');
  });

  it('rotateInviteLink should return token payload', async () => {
    organizerService.rotateInviteLink.mockResolvedValue({ token: 'rotated-token' });
    const response = await controller.rotateInviteLink('e1', 'u1', 'ORGANIZER');
    expect(response.success).toBe(true);
    expect(response.data.token).toBe('rotated-token');
  });
});
