import { Router } from 'express';
import { BroadcastController } from '../controllers/broadcast.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// User routes
router.get('/user/unread', BroadcastController.getUnreadBroadcasts);
router.get('/user/unread-count', BroadcastController.getUnreadCount);
router.put('/user/:broadcastId/read', BroadcastController.markAsRead);

// Admin routes
router.post('/create', BroadcastController.createBroadcast);
router.get('/admin/all', BroadcastController.getAllBroadcasts);
router.delete('/admin/:broadcastId', BroadcastController.deleteBroadcast);
router.put('/admin/:broadcastId/toggle', BroadcastController.toggleBroadcast);

export default router;

