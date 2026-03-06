import { ActivityLog } from '../models/ActivityLog.model';
import logger from '../utils/logger';

interface CreateActivityLogParams {
  userId: string;
  type: 'trade' | 'login' | 'setting' | 'strategy' | 'broker' | 'alert' | 'info';
  title: string;
  description: string;
  status?: 'success' | 'warning' | 'info' | 'error';
  metadata?: Record<string, unknown>;
}

export class ActivityLogService {
  static async createLog(params: CreateActivityLogParams) {
    try {
      const log = await ActivityLog.create({
        user: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        status: params.status || 'info',
        metadata: params.metadata || {}
      });

      return log;
    } catch (error) {
      logger.error('Error creating activity log:', error);
      throw error;
    }
  }

  static async getUserLogs(userId: string, limit: number = 50) {
    try {
      const logs = await ActivityLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return logs;
    } catch (error) {
      logger.error('Error fetching user logs:', error);
      throw error;
    }
  }

  static async deleteOldLogs(daysOld: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await ActivityLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      logger.info(`Deleted ${result.deletedCount} old activity logs`);
      return result;
    } catch (error) {
      logger.error('Error deleting old logs:', error);
      throw error;
    }
  }

  // Helper methods for common log types
  static async logLogin(userId: string, metadata?: Record<string, unknown>) {
    return this.createLog({
      userId,
      type: 'login',
      title: 'Login Activity',
      description: `Logged in successfully`,
      status: 'success',
      metadata
    });
  }

  static async logTrade(userId: string, description: string, metadata?: Record<string, unknown>) {
    return this.createLog({
      userId,
      type: 'trade',
      title: 'Trade Executed',
      description,
      status: 'success',
      metadata
    });
  }

  static async logStrategyChange(userId: string, description: string, metadata?: Record<string, unknown>) {
    return this.createLog({
      userId,
      type: 'strategy',
      title: 'Strategy Modified',
      description,
      status: 'info',
      metadata
    });
  }

  static async logBrokerConnection(userId: string, broker: string, success: boolean) {
    return this.createLog({
      userId,
      type: 'broker',
      title: success ? 'Broker Connected' : 'Broker Connection Failed',
      description: `${success ? 'Successfully connected to' : 'Failed to connect to'} ${broker}`,
      status: success ? 'success' : 'error',
      metadata: { broker }
    });
  }
}

