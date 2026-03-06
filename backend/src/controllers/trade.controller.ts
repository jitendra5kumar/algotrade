import { Request, Response } from 'express';
import Trade from '../models/Trade.model';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

class TradeController {
    /**
     * Get all trades for user
     * GET /api/trades
     */
    public async getTrades(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { 
                status, 
                symbol, 
                strategyId,
                page = 1, 
                limit = 10,
                sortBy = 'createdAt',
                order = 'desc'
            } = req.query;

            // Build filter
            const filter: Record<string, unknown> = { userId };
            if (status) filter.status = status;
            if (symbol) filter.symbol = symbol;
            if (strategyId) filter.strategyId = strategyId;

            // Pagination
            const skip = (Number(page) - 1) * Number(limit);
            const sortOrder = order === 'desc' ? -1 : 1;

            // Fetch trades
            const trades = await Trade.find(filter)
                .sort({ [sortBy as string]: sortOrder })
                .skip(skip)
                .limit(Number(limit))
                .populate('strategyId', 'name type');

            // Get total count
            const total = await Trade.countDocuments(filter);

            return sendSuccess(res, {
                trades,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            }, 'Trades retrieved successfully');
		} catch (error: unknown) {
            logger.error('Error fetching trades:', error);
            return sendError(res, (error as Error).message, 500);
        }
    }

    /**
     * Get trade by ID
     * GET /api/trades/:id
     */
    public async getTradeById(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;

            const trade = await Trade.findOne({ _id: id, userId })
                .populate('strategyId', 'name type symbol')
                .populate('userId', 'name email');

            if (!trade) {
                return sendError(res, 'Trade not found', 404);
            }

            return sendSuccess(res, trade, 'Trade retrieved successfully');
		} catch (error: unknown) {
            logger.error('Error fetching trade:', error);
            return sendError(res, (error as Error).message, 500);
        }
    }

    /**
     * Get trade statistics
     * GET /api/trades/stats
     */
    public async getStatistics(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { startDate, endDate, strategyId } = req.query;

            // Build filter
            const filter: Record<string, unknown> = { userId, status: 'CLOSED' };
            
            if (startDate && endDate) {
                filter.createdAt = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string),
                };
            }
            
            if (strategyId) {
                filter.strategyId = strategyId;
            }

            // Get all closed trades
            const trades = await Trade.find(filter);

            // Calculate statistics
            const totalTrades = trades.length;
            const winningTrades = trades.filter(t => t.netProfit > 0).length;
            const losingTrades = trades.filter(t => t.netProfit < 0).length;
            
            const totalProfit = trades
                .filter(t => t.netProfit > 0)
                .reduce((sum, t) => sum + t.netProfit, 0);
            
            const totalLoss = Math.abs(
                trades
                    .filter(t => t.netProfit < 0)
                    .reduce((sum, t) => sum + t.netProfit, 0)
            );

            const netProfit = totalProfit - totalLoss;
            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
            
            const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
            const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
            const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

            // Largest win and loss
            const largestWin = trades.length > 0 
                ? Math.max(...trades.map(t => t.netProfit)) 
                : 0;
            const largestLoss = trades.length > 0 
                ? Math.min(...trades.map(t => t.netProfit)) 
                : 0;

            // Calculate max drawdown
            let peak = 0;
            let maxDrawdown = 0;
            let runningProfit = 0;

            trades.forEach(trade => {
                runningProfit += trade.netProfit;
                if (runningProfit > peak) {
                    peak = runningProfit;
                }
                const drawdown = peak - runningProfit;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            });

            // Trades by symbol
            const symbolStats = trades.reduce((acc: Record<string, unknown>, trade) => {
                if (!acc[trade.symbol]) {
                    acc[trade.symbol] = {
                        symbol: trade.symbol,
                        count: 0,
                        profit: 0,
                    };
                }
                // Explicitly define the expected structure of the accumulator value
                const symbolStat = acc[trade.symbol] as {
                    symbol: string;
                    count: number;
                    profit: number;
                };
                symbolStat.count++;
                symbolStat.profit += trade.netProfit;
                return acc;
            }, {} as Record<string, { symbol: string; count: number; profit: number }>);

            const stats = {
                overview: {
                    totalTrades,
                    winningTrades,
                    losingTrades,
                    winRate: winRate.toFixed(2),
                    totalProfit: totalProfit.toFixed(2),
                    totalLoss: totalLoss.toFixed(2),
                    netProfit: netProfit.toFixed(2),
                    profitFactor: profitFactor.toFixed(2),
                },
                averages: {
                    avgWin: avgWin.toFixed(2),
                    avgLoss: avgLoss.toFixed(2),
                    avgProfit: (netProfit / Math.max(totalTrades, 1)).toFixed(2),
                },
                extremes: {
                    largestWin: largestWin.toFixed(2),
                    largestLoss: largestLoss.toFixed(2),
                    maxDrawdown: maxDrawdown.toFixed(2),
                },
                bySymbol: Object.values(symbolStats),
            };

            return sendSuccess(res, stats, 'Statistics retrieved successfully');
		} catch (error: unknown) {
            logger.error('Error fetching statistics:', error);
            return sendError(res, (error as Error).message, 500);
        }
    }

    /**
     * Get recent trades
     * GET /api/trades/recent
     */
    public async getRecentTrades(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { limit = 10 } = req.query;

            const trades = await Trade.find({ userId })
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .populate('strategyId', 'name type symbol');

            return sendSuccess(res, trades, 'Recent trades retrieved successfully');
		} catch (error: unknown) {
            logger.error('Error fetching recent trades:', error);
            return sendError(res, (error as Error).message, 500);
        }
    }

    /**
     * Get open trades
     * GET /api/trades/open
     */
    public async getOpenTrades(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const openTrades = await Trade.find({ userId, status: 'OPEN' })
                .populate('strategyId', 'name type symbol');

            return sendSuccess(res, openTrades, 'Open trades retrieved successfully');
		} catch (error: unknown) {
            logger.error('Error fetching open trades:', error);
            return sendError(res, (error as Error).message, 500);
        }
    }

    /**
     * Export trades to CSV
     * GET /api/trades/export
     */
    public async exportTrades(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { startDate, endDate, strategyId } = req.query;

            // Build filter
            const filter: Record<string, unknown> = { userId };
            
            if (startDate && endDate) {
                filter.createdAt = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string),
                };
            }
            
            if (strategyId) {
                filter.strategyId = strategyId;
            }

            const trades = await Trade.find(filter).populate('strategyId', 'name');

            // Convert to CSV format
            const csvHeader = 'Date,Symbol,Strategy,Side,Entry Price,Exit Price,Quantity,Gross P/L,Fees,Net P/L,P/L %,Status\n';
            
            const csvRows = trades.map(trade => {
                return [
                    trade.entryTime.toISOString(),
                    trade.symbol,
                    (trade.strategyId as { name?: string })?.name || 'N/A',
                    trade.side,
                    trade.entryPrice,
                    trade.exitPrice || 0,
                    trade.entryQuantity,
                    trade.grossProfit.toFixed(2),
                    trade.fees.toFixed(2),
                    trade.netProfit.toFixed(2),
                    trade.profitPercentage.toFixed(2),
                    trade.status,
                ].join(',');
            }).join('\n');

            const csv = csvHeader + csvRows;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=trades.csv');
            
            return res.status(200).send(csv);
		} catch (error: unknown) {
            logger.error('Error exporting trades:', error);
            return sendError(res, (error as Error).message, 500);
        }
    }
}

export default new TradeController();

