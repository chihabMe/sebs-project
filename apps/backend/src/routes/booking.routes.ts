import { Router } from 'express';
import { createBooking, getMyBookings, cancelBooking, getEventBookings } from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { bookingCreateSchema } from '@sebs/shared';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.post('/', validate(bookingCreateSchema), createBooking);
router.get('/my', getMyBookings);
router.patch('/:id/cancel', cancelBooking);

// Organizer/Admin only route
router.get('/event/:eventId', authorize('ORGANIZER', 'ADMIN'), getEventBookings);

export default router;
