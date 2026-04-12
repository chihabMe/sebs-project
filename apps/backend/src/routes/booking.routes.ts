import { Router } from 'express';
import { createBooking, getMyBookings, cancelBooking, downloadTicket, checkBookingStatus } from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { bookingCreateSchema } from '@sebs/shared';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.post('/', authorize('USER'), validate(bookingCreateSchema), createBooking);
router.get('/my', authorize('USER'), getMyBookings);
router.get('/event/:eventId/status', authorize('USER'), checkBookingStatus);
router.get('/:id/ticket', downloadTicket);
router.patch('/:id/cancel', authorize('USER'), cancelBooking);

// Organizer/Admin only route handled in organizer.routes.ts

export default router;
