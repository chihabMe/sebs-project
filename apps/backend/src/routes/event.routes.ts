import { Router } from 'express';
import { createEvent, getAllEvents, getEventById } from '../controllers/event.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { eventCreateSchema } from '@sebs/shared';

const router = Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes (Organizer & Admin)
router.post(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  upload.single('image'), // Must come before validate so req.body is parsed from multipart/form-data
  validate(eventCreateSchema),
  createEvent
);

export default router;
