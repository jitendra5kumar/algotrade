import StrategyLog from '../models/StrategyLog.model';
import logger from '../utils/logger';

class StrategyLogService {
    public async log(userId: string, strategyId: string, level: 'info'|'warn'|'error', category: 'create'|'update'|'signal'|'order'|'trend'|'risk'|'system', message: string, meta?: Record<string, unknown>): Promise<void> {
        try {
            const logDoc = await StrategyLog.create({ userId, strategyId, level, category, message, meta });
            
            // Emit log via WebSocket for real-time updates
            try {
                const { default: websocketServer } = await import('../websocket/websocket.server');
                websocketServer.emitStrategyLog(strategyId, {
                    _id: String(logDoc._id),
                    userId,
                    strategyId,
                    level,
                    category,
                    message,
                    meta: meta || {},
                    createdAt: logDoc.createdAt,
                });
            } catch (wsError) {
                // WebSocket emission is optional, don't fail if it errors
                logger.debug('Failed to emit strategy log via WebSocket:', wsError);
            }
        } catch (e) {
            logger.error('Failed to write strategy log', e);
        }
    }

    public async getLogs(userId: string, strategyId: string, { level, category, page = 1, limit = 50 }: { level?: string; category?: string; page?: number; limit?: number }) {
        const query: Record<string, unknown> = { userId, strategyId };
        if (level) query.level = level;
        if (category) query.category = category;
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            StrategyLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            StrategyLog.countDocuments(query)
        ]);
        return { items, total, page: Number(page), limit: Number(limit) };
    }

    public async deleteLog(userId: string, logId: string): Promise<void> {
        const log = await StrategyLog.findOne({ _id: logId, userId });
        if (!log) {
            throw new Error('Log not found or unauthorized');
        }
        await StrategyLog.deleteOne({ _id: logId });
    }

    public async deleteAllLogs(userId: string, strategyId: string): Promise<number> {
        const result = await StrategyLog.deleteMany({ userId, strategyId });
        return result.deletedCount || 0;
    }
}

export default new StrategyLogService();


