import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// User routes
router.get('/user', ChatController.getUserChat);
router.post('/user/send', ChatController.sendUserMessage);
router.put('/user/read', ChatController.markUserMessagesRead);
router.get('/user/unread-count', ChatController.getUserUnreadCount);

// Admin routes
router.get('/admin/all', ChatController.getAllChats);
router.get('/admin/:chatId', ChatController.getAdminChat);
router.post('/admin/:chatId/send', ChatController.sendAdminMessage);
router.put('/admin/:chatId/read', ChatController.markAdminMessagesRead);
router.put('/admin/:chatId/status', ChatController.updateChatStatus);

export default router;

