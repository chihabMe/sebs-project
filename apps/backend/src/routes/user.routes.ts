import { Router } from 'express';
import { getProfile, updateProfile, getAttendanceHistory } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '@sebs/shared';

const router = Router();

// Protect all user routes
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/attendance', getAttendanceHistory);

export default router;
