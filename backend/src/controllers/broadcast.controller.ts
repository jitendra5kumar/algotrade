import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Broadcast } from '../models/Broadcast.model';
import User from '../models/User.model';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

export class BroadcastController {
    /**
     * Create broadcast message (Admin only)
     * POST /api/broadcast/create
     */
    static async createBroadcast(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            // Admin role check is handled by middleware

            const { title, message } = req.body;

            if (!title || !title.trim()) {
                return sendError(res, 'Title is required', 400);
            }

            if (!message || !message.trim()) {
                return sendError(res, 'Message is required', 400);
            }

            const broadcast = await Broadcast.create({
                title: title.trim(),
                message: message.trim(),
                createdBy: userId,
                isActive: true,
                readBy: []
            });

            logger.info(`Admin ${userId} created broadcast: ${broadcast.title}`);
            return sendSuccess(res, broadcast, 'Broadcast created successfully', 201);
        } catch (error: unknown) {
            logger.error('Error creating broadcast:', error);
            return sendError(res, (error as Error).message || 'Failed to create broadcast', 500);
        }
    }

    /**
     * Get all broadcasts for admin
     * GET /api/broadcast/admin/all
     */
    static async getAllBroadcasts(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const broadcasts = await Broadcast.find()
                .sort({ createdAt: -1 })
                .populate('createdBy', 'name email')
                .lean();

            const totalUsers = await User.countDocuments();
            const broadcastsWithStats = broadcasts.map(broadcast => ({
                ...broadcast,
                totalUsers,
                readCount: broadcast.readBy?.length || 0,
                unreadCount: totalUsers - (broadcast.readBy?.length || 0)
            }));

            return sendSuccess(res, broadcastsWithStats, 'Broadcasts fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching broadcasts:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch broadcasts', 500);
        }
    }

    /**
     * Get active broadcasts for user (unread only)
     * GET /api/broadcast/user/unread
     */
    static async getUnreadBroadcasts(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const broadcasts = await Broadcast.find({
                isActive: true,
                readBy: { $ne: userId } // Not in readBy array
            })
                .sort({ createdAt: -1 })
                .lean();

            return sendSuccess(res, broadcasts, 'Unread broadcasts fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching unread broadcasts:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch unread broadcasts', 500);
        }
    }

    /**
     * Get unread count for user
     * GET /api/broadcast/user/unread-count
     */
    static async getUnreadCount(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const count = await Broadcast.countDocuments({
                isActive: true,
                readBy: { $ne: userId }
            });

            return sendSuccess(res, { count }, 'Unread count fetched successfully');
        } catch (error: unknown) {
            logger.error('Error fetching unread count:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch unread count', 500);
        }
    }

    /**
     * Mark broadcast as read
     * PUT /api/broadcast/user/:broadcastId/read
     */
    static async markAsRead(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { broadcastId } = req.params;

            const broadcast = await Broadcast.findById(broadcastId);
            if (!broadcast) {
                return sendError(res, 'Broadcast not found', 404);
            }

            // Add userId to readBy array if not already present
            const userIdObjectId = new mongoose.Types.ObjectId(userId);
            if (!broadcast.readBy.some(id => id.toString() === userId)) {
                broadcast.readBy.push(userIdObjectId);
                await broadcast.save();
            }

            return sendSuccess(res, { success: true }, 'Broadcast marked as read');
        } catch (error: unknown) {
            logger.error('Error marking broadcast as read:', error);
            return sendError(res, (error as Error).message || 'Failed to mark as read', 500);
        }
    }

    /**
     * Delete broadcast (Admin only)
     * DELETE /api/broadcast/admin/:broadcastId
     */
    static async deleteBroadcast(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { broadcastId } = req.params;

            const broadcast = await Broadcast.findByIdAndDelete(broadcastId);
            if (!broadcast) {
                return sendError(res, 'Broadcast not found', 404);
            }

            logger.info(`Admin ${userId} deleted broadcast: ${broadcast.title}`);
            return sendSuccess(res, { success: true }, 'Broadcast deleted successfully');
        } catch (error: unknown) {
            logger.error('Error deleting broadcast:', error);
            return sendError(res, (error as Error).message || 'Failed to delete broadcast', 500);
        }
    }

    /**
     * Toggle broadcast active status (Admin only)
     * PUT /api/broadcast/admin/:broadcastId/toggle
     */
    static async toggleBroadcast(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { broadcastId } = req.params;

            const broadcast = await Broadcast.findById(broadcastId);
            if (!broadcast) {
                return sendError(res, 'Broadcast not found', 404);
            }

            broadcast.isActive = !broadcast.isActive;
            await broadcast.save();

            logger.info(`Admin ${userId} toggled broadcast ${broadcastId} to ${broadcast.isActive}`);
            return sendSuccess(
                res, 
                { isActive: broadcast.isActive }, 
                `Broadcast ${broadcast.isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error: unknown) {
            logger.error('Error toggling broadcast:', error);
            return sendError(res, (error as Error).message || 'Failed to toggle broadcast', 500);
        }
    }
}

