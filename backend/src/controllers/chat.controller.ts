import { Request, Response } from 'express';
import { Chat } from '../models/Chat.model';
import User from '../models/User.model';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';
// import { requireAdmin } from '../middleware/admin.middleware';

export class ChatController {
    /**
     * Get or create chat for user
     * GET /api/chat/user
     */
    static async getUserChat(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            // Find existing chat or create new one
            let chat = await Chat.findOne({ userId });

            if (!chat) {
                // Get user details
                const user = await User.findById(userId);
                if (!user) {
                    return sendError(res, 'User not found', 404);
                }

                // Create new chat
                chat = await Chat.create({
                    userId,
                    userName: user.name,
                    userEmail: user.email,
                    messages: [],
                    status: 'open'
                });
            }

            return sendSuccess(res, chat, 'Chat fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching user chat:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch chat', 500);
        }
    }

    /**
     * Send message from user
     * POST /api/chat/user/send
     */
    static async sendUserMessage(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { message } = req.body;
            if (!message || !message.trim()) {
                return sendError(res, 'Message is required', 400);
            }

            // Find or create chat
            let chat = await Chat.findOne({ userId });

            if (!chat) {
                const user = await User.findById(userId);
                if (!user) {
                    return sendError(res, 'User not found', 404);
                }

                chat = await Chat.create({
                    userId,
                    userName: user.name,
                    userEmail: user.email,
                    messages: [],
                    status: 'open'
                });
            }

            // Add message
            chat.messages.push({
                sender: 'user',
                message: message.trim(),
                timestamp: new Date(),
                isRead: false
            });

            // Update last message info
            chat.lastMessage = message.trim();
            chat.lastMessageTime = new Date();
            chat.unreadCount = (chat.unreadCount || 0) + 1;
            chat.status = 'open';

            await chat.save();

            logger.info(`User ${userId} sent message`);
            return sendSuccess(res, chat, 'Message sent successfully');
		} catch (error: unknown) {
            logger.error('Error sending user message:', error);
            return sendError(res, (error as Error).message || 'Failed to send message', 500);
        }
    }

    /**
     * Mark messages as read by user
     * PUT /api/chat/user/read
     */
    static async markUserMessagesRead(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const chat = await Chat.findOne({ userId });
            if (!chat) {
                return sendError(res, 'Chat not found', 404);
            }

            // Mark all admin messages as read
            let updatedCount = 0;
            chat.messages.forEach(msg => {
                if (msg.sender === 'admin' && !msg.isRead) {
                    msg.isRead = true;
                    updatedCount++;
                }
            });

            await chat.save();

            return sendSuccess(res, { updatedCount }, 'Messages marked as read');
		} catch (error: unknown) {
            logger.error('Error marking messages as read:', error);
            return sendError(res, (error as Error).message || 'Failed to mark messages as read', 500);
        }
    }

    /**
     * Get all chats for admin
     * GET /api/chat/admin/all
     */
    static async getAllChats(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            // Admin role check is handled by middleware

            const { status } = req.query;
            const filter: Record<string, unknown> = {};
            
            if (status === 'open' || status === 'closed') {
                filter.status = status;
            }

            const chats = await Chat.find(filter)
                .sort({ lastMessageTime: -1 })
                .lean();

            const chatsWithUnread = chats.map(chat => ({
                ...chat,
                unreadByAdmin: chat.messages.filter(m => m.sender === 'user' && !m.isRead).length
            }));

            logger.info(`Admin fetched ${chats.length} chats`);
            return sendSuccess(res, chatsWithUnread, 'Chats fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching chats for admin:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch chats', 500);
        }
    }

    /**
     * Get specific chat for admin
     * GET /api/chat/admin/:chatId
     */
    static async getAdminChat(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { chatId } = req.params;

            const chat = await Chat.findById(chatId);
            if (!chat) {
                return sendError(res, 'Chat not found', 404);
            }

            return sendSuccess(res, chat, 'Chat fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching admin chat:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch chat', 500);
        }
    }

    /**
     * Send message from admin
     * POST /api/chat/admin/:chatId/send
     */
    static async sendAdminMessage(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { chatId } = req.params;
            const { message } = req.body;

            if (!message || !message.trim()) {
                return sendError(res, 'Message is required', 400);
            }

            const chat = await Chat.findById(chatId);
            if (!chat) {
                return sendError(res, 'Chat not found', 404);
            }

            // Add admin message
            chat.messages.push({
                sender: 'admin',
                message: message.trim(),
                timestamp: new Date(),
                isRead: false
            });

            // Update last message info
            chat.lastMessage = message.trim();
            chat.lastMessageTime = new Date();
            
            // Reset unread count as admin is replying
            chat.unreadCount = 0;

            await chat.save();

            logger.info(`Admin replied to chat ${chatId}`);
            return sendSuccess(res, chat, 'Message sent successfully');
		} catch (error: unknown) {
            logger.error('Error sending admin message:', error);
            return sendError(res, (error as Error).message || 'Failed to send message', 500);
        }
    }

    /**
     * Mark messages as read by admin
     * PUT /api/chat/admin/:chatId/read
     */
    static async markAdminMessagesRead(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { chatId } = req.params;

            const chat = await Chat.findById(chatId);
            if (!chat) {
                return sendError(res, 'Chat not found', 404);
            }

            // Mark all user messages as read
            let updatedCount = 0;
            chat.messages.forEach(msg => {
                if (msg.sender === 'user' && !msg.isRead) {
                    msg.isRead = true;
                    updatedCount++;
                }
            });

            // Reset unread count
            chat.unreadCount = 0;

            await chat.save();

            return sendSuccess(res, { updatedCount }, 'Messages marked as read');
		} catch (error: unknown) {
            logger.error('Error marking admin messages as read:', error);
            return sendError(res, (error as Error).message || 'Failed to mark messages as read', 500);
        }
    }

    /**
     * Update chat status
     * PUT /api/chat/admin/:chatId/status
     */
    static async updateChatStatus(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { chatId } = req.params;
            const { status } = req.body;

            if (!status || !['open', 'closed'].includes(status)) {
                return sendError(res, 'Invalid status. Must be "open" or "closed"', 400);
            }

            const chat = await Chat.findById(chatId);
            if (!chat) {
                return sendError(res, 'Chat not found', 404);
            }

            chat.status = status;
            await chat.save();

            logger.info(`Chat ${chatId} status updated to ${status}`);
            return sendSuccess(res, { status }, 'Chat status updated successfully');
		} catch (error: unknown) {
            logger.error('Error updating chat status:', error);
            return sendError(res, (error as Error).message || 'Failed to update chat status', 500);
        }
    }

    /**
     * Get unread count for user
     * GET /api/chat/user/unread-count
     */
    static async getUserUnreadCount(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const chat = await Chat.findOne({ userId });
            
            if (!chat) {
                return sendSuccess(res, { unreadCount: 0 }, 'No unread messages');
            }

            // Count unread admin messages
            const unreadCount = chat.messages.filter(
                msg => msg.sender === 'admin' && !msg.isRead
            ).length;

            return sendSuccess(res, { unreadCount }, 'Unread count fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching unread count:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch unread count', 500);
        }
    }
}

