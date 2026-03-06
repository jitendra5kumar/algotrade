import { Request, Response } from 'express';
import { ActivityLogService } from '../services/activity-log.service';
import logger from '../utils/logger';

export class ActivityLogController {
  static async getUserActivityLogs(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await ActivityLogService.getUserLogs(userId, limit);

      // Format logs for frontend
      const formattedLogs = logs.map((log: Record<string, unknown>) => {
        const createdAt = new Date(log.createdAt as string);
        // Format as DD-MM-YYYY HH:MM:SS
        const formattedDateTime = formatDateTime(createdAt);
        
        return {
          id: log._id,
          type: log.type,
          title: log.title,
          description: log.description,
          time: formattedDateTime,
          status: log.status,
          metadata: log.metadata
        };
      });

      res.json({
        success: true,
        data: formattedLogs
      });
    } catch (error) {
      logger.error('Error in getUserActivityLogs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity logs'
      });
    }
  }

  static async createActivityLog(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { type, title, description, status, metadata } = req.body;

      const log = await ActivityLogService.createLog({
        userId,
        type,
        title,
        description,
        status,
        metadata
      });

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      logger.error('Error in createActivityLog:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create activity log'
      });
    }
  }
}

// Helper function to format date and time as DD-MM-YYYY HH:MM:SS
function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

