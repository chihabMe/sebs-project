import { Router } from 'express';
import { getAllTags, createTag, deleteTag } from '../controllers/tag.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { tagCreateSchema } from '@sebs/shared';

const router = Router();

router.get('/', getAllTags);
router.post('/', authenticate, validate(tagCreateSchema), createTag);
router.delete('/:id', authenticate, deleteTag);

export default router;
