import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/helpers';
import strategyLogService from '../services/strategy-log.service';

class StrategyLogController {
    public async list(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) return sendError(res, 'Not authorized', 401);
            const result = await strategyLogService.getLogs(userId, id, req.query);
            return sendSuccess(res, result, 'Logs fetched');
        } catch (e: unknown) {
            return sendError(res, (e as Error).message || 'Failed to fetch logs', 500);
        }
    }

    public async delete(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            const { id, logId } = req.params;
            if (!userId) return sendError(res, 'Not authorized', 401);
            await strategyLogService.deleteLog(userId, logId);
            return sendSuccess(res, { strategyId: id, logId }, 'Log deleted successfully');
        } catch (e: unknown) {
            return sendError(res, (e as Error).message || 'Failed to delete log', 500);
        }
    }

    public async deleteAll(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) return sendError(res, 'Not authorized', 401);
            const deletedCount = await strategyLogService.deleteAllLogs(userId, id);
            return sendSuccess(res, { strategyId: id, deletedCount }, 'All logs deleted successfully');
        } catch (e: unknown) {
            return sendError(res, (e as Error).message || 'Failed to delete logs', 500);
        }
    }
}

export default new StrategyLogController();


