import { Router } from 'express';
import { createReview, getEventReviews, deleteReview } from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { reviewCreateSchema } from '@sebs/shared';

const router = Router();

// Public route
router.get('/event/:eventId', getEventReviews);

// Protected routes
router.use(authenticate);
router.post('/', authorize('USER'), validate(reviewCreateSchema), createReview);
router.delete('/:id', deleteReview);

export default router;
