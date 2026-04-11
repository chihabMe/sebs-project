import { Router } from 'express';
import { getEventForm, updateEventForm } from '../controllers/event-form.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { eventFormUpdateSchema } from '@sebs/shared';

const router = Router();

// Public route to get questions
router.get('/:eventId', getEventForm);

// Protected route to manage questions (Organizer & Admin)
router.put('/:eventId', authenticate, authorize('ORGANIZER', 'ADMIN'), validate(eventFormUpdateSchema), updateEventForm);

export default router;
