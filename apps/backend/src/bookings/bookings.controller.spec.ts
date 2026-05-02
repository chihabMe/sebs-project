import { BookingsController } from './bookings.controller';

describe('BookingsController', () => {
  const bookingsService = {
    create: jest.fn(),
    checkIn: jest.fn(),
    findMy: jest.fn(),
    getTicket: jest.fn(),
    cancel: jest.fn(),
    checkStatus: jest.fn(),
  } as any;

  let controller: BookingsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new BookingsController(bookingsService);
  });

  it('create should return confirmed success message when booking is confirmed', async () => {
    bookingsService.create.mockResolvedValue({ id: 'b1', status: 'CONFIRMED' });

    const response = await controller.create('u1', 'USER', { eventId: 'e1', answers: [] }, {});

    expect(response.success).toBe(true);
    expect(response.message).toBe('Booking confirmed');
  });

  it('checkIn should return success payload and booking data', async () => {
    bookingsService.checkIn.mockResolvedValue({ id: 'b1', attended: true });

    const response = await controller.checkIn('11111111-1111-4111-8111-111111111111', 'u1');

    expect(bookingsService.checkIn).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 'u1');
    expect(response).toEqual({
      success: true,
      message: 'Checked in successfully',
      data: { id: 'b1', attended: true },
    });
  });

  it('checkStatus should wrap service payload in success response', async () => {
    bookingsService.checkStatus.mockResolvedValue({ id: 'b1', isBooked: true, status: 'CONFIRMED' });

    const response = await controller.checkStatus('11111111-1111-4111-8111-111111111111', 'u1');

    expect(response.success).toBe(true);
    expect(response.data.status).toBe('CONFIRMED');
  });
});
