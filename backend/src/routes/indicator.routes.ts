import { Router } from 'express';
import { IndicatorController } from '../controllers/indicator.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public route - visible indicators
router.get('/visible', IndicatorController.getVisibleIndicators);

// Protected routes
router.use(protect);

// Admin routes
router.get('/admin/all', IndicatorController.getAllIndicators);
router.put('/admin/:indicatorId/visibility', IndicatorController.toggleVisibility);
router.put('/admin/:indicatorId/parameters', IndicatorController.updateIndicatorParameters);
router.post('/admin/seed', IndicatorController.seedIndicators);

export default router;

