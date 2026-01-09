import { Router } from 'express';
import {
  getGroups,
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
  createGroupValidation,
} from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Group routes
router.get('/', getGroups);
router.post('/', validate(createGroupValidation), createGroup);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;
