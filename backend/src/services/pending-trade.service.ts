import PendingTrade, { IPendingTrade } from '../models/PendingTrade.model';
import Strategy from '../models/Strategy.model';
import logger from '../utils/logger';
import { isMarketOpen } from '../utils/helpers';
import strategyExecutionService from './strategy-execution.service';

class PendingTradeService {
    /**
     * Create a pending trade
     */
    public async createPendingTrade(data: {
        userId: string;
        strategyId: string;
        symbol: string;
        exchangeSegment: string;
        exchangeInstrumentID: number;
        orderType: 'MARKET' | 'LIMIT';
        productType: 'MIS' | 'NRML' | 'CNC';
        side: 'BUY' | 'SELL';
        quantity: number;
        signalPrice: number;
        referenceCandle?: {
            high: number;
            low: number;
            timestamp: Date;
        };
        scheduledExecutionTime?: Date;
    }): Promise<IPendingTrade> {
        try {
            const pendingTrade = new PendingTrade({
                ...data,
                signalTime: new Date(),
                status: 'PENDING',
            });

            await pendingTrade.save();

            logger.info('Pending trade created', {
                pendingTradeId: String(pendingTrade._id),
                strategyId: data.strategyId,
                symbol: data.symbol,
                side: data.side,
            });

            return pendingTrade;
        } catch (error: unknown) {
            logger.error('Error creating pending trade:', error);
            throw error;
        }
    }

    /**
     * Get pending trades for execution
     */
    public async getPendingTrades(): Promise<IPendingTrade[]> {
        try {
            const pendingTrades = await PendingTrade.find({
                status: 'PENDING',
            })
                .populate('strategyId')
                .populate('userId')
                .sort({ signalTime: 1 });

            return pendingTrades;
        } catch (error: unknown) {
            logger.error('Error fetching pending trades:', error);
            throw error;
        }
    }

    /**
     * Execute pending trades (called at market open)
     */
    public async executePendingTrades(): Promise<void> {
        try {
            // Check if market is open
            if (!isMarketOpen()) {
                logger.info('Market is not open, skipping pending trade execution');
                return;
            }

            const pendingTrades = await this.getPendingTrades();

            if (pendingTrades.length === 0) {
                logger.info('No pending trades to execute');
                return;
            }

            logger.info(`Executing ${pendingTrades.length} pending trades`);

            for (const pendingTrade of pendingTrades) {
                try {
                    // Verify strategy still exists and is active
                    const strategy = await Strategy.findById(pendingTrade.strategyId);
                    const pendingTradeId = String(pendingTrade._id);
                    if (!strategy) {
                        logger.warn('Strategy not found for pending trade', {
                            pendingTradeId,
                            strategyId: String(pendingTrade.strategyId),
                        });
                        await this.markAsCancelled(pendingTradeId, 'Strategy not found');
                        continue;
                    }

                    if (strategy.status !== 'ACTIVE') {
                        logger.warn('Strategy is not active for pending trade', {
                            pendingTradeId,
                            strategyId: String(pendingTrade.strategyId),
                            strategyStatus: strategy.status,
                        });
                        await this.markAsCancelled(pendingTradeId, 'Strategy is not active');
                        continue;
                    }

                    // Execute the trade
                    await strategyExecutionService.executeStrategyAction(
                        String(pendingTrade.strategyId),
                        String(pendingTrade.userId),
                        pendingTrade.side,
                        pendingTrade.quantity
                    );

                    // Mark as executed
                    await this.markAsExecuted(pendingTradeId);

                    logger.info('Pending trade executed successfully', {
                        pendingTradeId,
                        strategyId: String(pendingTrade.strategyId),
                        symbol: pendingTrade.symbol,
                    });
                } catch (error: unknown) {
                    const pendingTradeId = String(pendingTrade._id);
                    logger.error('Error executing pending trade:', {
                        pendingTradeId,
                        error: error instanceof Error ? error.message : String(error),
                    });

                    await this.markAsError(
                        pendingTradeId,
                        error instanceof Error ? error.message : 'Unknown error'
                    );
                }
            }
        } catch (error: unknown) {
            logger.error('Error in executePendingTrades:', error);
            throw error;
        }
    }

    /**
     * Mark pending trade as executed
     */
    public async markAsExecuted(pendingTradeId: string): Promise<void> {
        try {
            await PendingTrade.findByIdAndUpdate(pendingTradeId, {
                status: 'EXECUTED',
                executedAt: new Date(),
            });
        } catch (error: unknown) {
            logger.error('Error marking pending trade as executed:', error);
            throw error;
        }
    }

    /**
     * Mark pending trade as cancelled
     */
    public async markAsCancelled(pendingTradeId: string, reason?: string): Promise<void> {
        try {
            await PendingTrade.findByIdAndUpdate(pendingTradeId, {
                status: 'CANCELLED',
                executionError: reason,
            });
        } catch (error: unknown) {
            logger.error('Error marking pending trade as cancelled:', error);
            throw error;
        }
    }

    /**
     * Mark pending trade as error
     */
    public async markAsError(pendingTradeId: string, error: string): Promise<void> {
        try {
            await PendingTrade.findByIdAndUpdate(pendingTradeId, {
                status: 'CANCELLED',
                executionError: error,
            });
        } catch (err: unknown) {
            logger.error('Error marking pending trade as error:', err);
            throw err;
        }
    }
}

const pendingTradeService = new PendingTradeService();
export default pendingTradeService;

