import { Router } from 'express';
import { createEvent, getAllEvents, getEventById, getOrganizerEvents, updateEvent, deleteEvent } from '../controllers/event.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { eventCreateSchema } from '@sebs/shared';

const router = Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes (Organizer & Admin)
router.get('/my/events', authenticate, authorize('ORGANIZER', 'ADMIN'), getOrganizerEvents);

router.post(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  upload.single('image'),
  validate(eventCreateSchema),
  createEvent
);

router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  upload.single('image'),
  validate(eventCreateSchema),
  updateEvent
);

router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), deleteEvent);

export default router;
