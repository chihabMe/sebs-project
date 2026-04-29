import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizerService } from './organizer.service';

describe('OrganizerService', () => {
  const prisma = {
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as any;

  const mailService = {
    sendBookingConfirmation: jest.fn().mockResolvedValue(true),
  } as any;

  let service: OrganizerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizerService(prisma, mailService);
  });

  it('getEventAttendees should throw when event does not exist', async () => {
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(service.getEventAttendees('e1', 'u1', 'ORGANIZER', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getEventAttendees should reject non-owner organizer', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', organizerId: 'owner-id' });
    await expect(service.getEventAttendees('e1', 'other-user', 'ORGANIZER', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getEventAttendees should return paginated payload with summary', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', organizerId: 'owner-id' });
    prisma.booking.findMany.mockResolvedValue([{ id: 'b1' }]);
    prisma.booking.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const result = await service.getEventAttendees('e1', 'owner-id', 'ORGANIZER', { page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.summary.confirmed).toBe(1);
  });

  it('updateBookingStatus should send confirmation email when confirmed', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      event: { id: 'e1', organizerId: 'owner-id', title: 'Event', date: new Date(), location: 'Online' },
    });
    prisma.booking.update.mockResolvedValue({
      id: 'b1',
      status: 'CONFIRMED',
      user: { id: 'u1', name: 'User', email: 'u@example.com' },
      event: { id: 'e1', title: 'Event', date: new Date(), location: 'Online' },
    });

    const booking = await service.updateBookingStatus('b1', 'CONFIRMED', 'owner-id', 'ORGANIZER');
    expect(booking.status).toBe('CONFIRMED');
    expect(mailService.sendBookingConfirmation).toHaveBeenCalled();
  });

  it('removeAttendee should throw unauthorized for wrong organizer', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      event: { id: 'e1', organizerId: 'owner-id' },
    });

    await expect(service.removeAttendee('b1', 'other-user', 'ORGANIZER')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('generateInviteLink should return existing token when present', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'e1',
      organizerId: 'owner-id',
      invitationToken: 'existing-token',
    });

    const invite = await service.generateInviteLink('e1', 'owner-id', 'ORGANIZER');
    expect(invite).toEqual({ token: 'existing-token' });
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('generateInviteLink should create token when missing', async () => {
    const randomUUIDSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');
    prisma.event.findUnique.mockResolvedValue({
      id: 'e1',
      organizerId: 'owner-id',
      invitationToken: null,
    });
    prisma.event.update.mockResolvedValue({
      id: 'e1',
      invitationToken: '11111111-1111-4111-8111-111111111111',
    });

    const invite = await service.generateInviteLink('e1', 'owner-id', 'ORGANIZER');
    expect(invite).toEqual({ token: '11111111-1111-4111-8111-111111111111' });
    randomUUIDSpy.mockRestore();
  });

  it('rotateInviteLink should always generate a fresh token', async () => {
    const randomUUIDSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('22222222-2222-4222-8222-222222222222');
    prisma.event.findUnique.mockResolvedValue({
      id: 'e1',
      organizerId: 'owner-id',
      invitationToken: 'existing-token',
    });
    prisma.event.update.mockResolvedValue({
      id: 'e1',
      invitationToken: '22222222-2222-4222-8222-222222222222',
    });

    const invite = await service.rotateInviteLink('e1', 'owner-id', 'ORGANIZER');
    expect(invite).toEqual({ token: '22222222-2222-4222-8222-222222222222' });
    randomUUIDSpy.mockRestore();
  });
});
