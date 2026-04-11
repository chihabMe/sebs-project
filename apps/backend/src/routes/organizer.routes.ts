import { Router } from 'express';
import { getEventAttendees, updateBookingStatus, removeAttendee, generateInviteLink } from '../controllers/organizer.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { bookingStatusUpdateSchema } from '@sebs/shared';

const router = Router();

// Only Organizers and Admins
router.use(authenticate, authorize('ORGANIZER', 'ADMIN'));

router.get('/event/:eventId/attendees', getEventAttendees);
router.patch('/booking/:bookingId/status', validate(bookingStatusUpdateSchema), updateBookingStatus);
router.delete('/booking/:bookingId', removeAttendee);
router.post('/event/:eventId/invite-link', generateInviteLink);

export default router;
