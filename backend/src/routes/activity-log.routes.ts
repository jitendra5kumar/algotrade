import { Router } from 'express';
import { ActivityLogController } from '../controllers/activity-log.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Get user activity logs
router.get('/', ActivityLogController.getUserActivityLogs);

// Create activity log
router.post('/', ActivityLogController.createActivityLog);

export default router;

