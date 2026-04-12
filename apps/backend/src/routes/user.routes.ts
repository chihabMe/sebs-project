import { Router } from 'express';
import { getProfile, updateProfile, getAttendanceHistory, getPublicProfile } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '@sebs/shared';

const router = Router();

// Public routes
router.get('/public/:userId', getPublicProfile);

// Protect all other user routes
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/attendance', getAttendanceHistory);

export default router;
