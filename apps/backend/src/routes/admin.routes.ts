import { Router } from 'express';
import { getUsers, updateUserStatus, getPendingEvents, approveEvent, getStats, createUser } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Only Admins can access these routes
router.use(authenticate, authorize('ADMIN'));

router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUserStatus);
router.get('/events/pending', getPendingEvents);
router.patch('/events/:id/approve', approveEvent);
router.get('/stats', getStats);

export default router;
