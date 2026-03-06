import { Request, Response } from 'express';
import { IndicatorTemplate } from '../models/IndicatorTemplate.model';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

export class IndicatorController {
    /**
     * Get all indicators (for admin)
     * GET /api/indicators/admin/all
     */
    static async getAllIndicators(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const indicators = await IndicatorTemplate.find().sort({ name: 1 });

            logger.info(`Admin fetched ${indicators.length} indicators`);
            return sendSuccess(res, indicators, 'Indicators fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching indicators:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch indicators', 500);  
        }
    }

    /**
     * Get visible indicators (for users)
     * GET /api/indicators/visible
     */
    static async getVisibleIndicators(_req: Request, res: Response): Promise<Response> {
        try {
            const indicators = await IndicatorTemplate.find({ isVisibleToUsers: true }).sort({ name: 1 });

            return sendSuccess(res, indicators, 'Visible indicators fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching visible indicators:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch indicators', 500);
        }
    }

    /**
     * Toggle indicator visibility
     * PUT /api/indicators/admin/:indicatorId/visibility
     */
    static async toggleVisibility(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { indicatorId } = req.params;
            const { isVisible } = req.body;

            if (typeof isVisible !== 'boolean') {
                return sendError(res, 'Invalid visibility value', 400);
            }

            const indicator = await IndicatorTemplate.findById(indicatorId);
            if (!indicator) {
                return sendError(res, 'Indicator not found', 404);
            }

            indicator.isVisibleToUsers = isVisible;
            await indicator.save();

            logger.info(`Admin ${userId} set ${indicator.name} visibility to ${isVisible}`);
            return sendSuccess(
                res,
                { isVisible },
                `Indicator ${isVisible ? 'enabled' : 'disabled'} for users`
            );
		} catch (error: unknown) {
            logger.error('Error toggling indicator visibility:', error);
            return sendError(res, (error as Error).message || 'Failed to toggle visibility', 500);
        }
    }

    /**
     * Seed default indicators (run once)
     * POST /api/indicators/admin/seed
     */
    static async seedIndicators(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const defaultIndicators = [
                {
                    name: 'sma',
                    displayName: 'Simple Moving Average (SMA)',
                    description: 'Average price over a specific period',
                    category: 'trend',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 20, min: 5, max: 200 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'ema',
                    displayName: 'Exponential Moving Average (EMA)',
                    description: 'Weighted average giving more importance to recent prices',
                    category: 'trend',
                    parameters: [
                        { name: 'fast', label: 'Fast Period', type: 'number', defaultValue: 12, min: 5, max: 50 },
                        { name: 'slow', label: 'Slow Period', type: 'number', defaultValue: 26, min: 10, max: 200 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'rsi',
                    displayName: 'Relative Strength Index (RSI)',
                    description: 'Momentum oscillator measuring speed and magnitude of price changes',
                    category: 'momentum',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 14, min: 2, max: 50 },
                        { name: 'overbought', label: 'Overbought', type: 'number', defaultValue: 70, min: 50, max: 90 },
                        { name: 'oversold', label: 'Oversold', type: 'number', defaultValue: 30, min: 10, max: 50 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'macd',
                    displayName: 'MACD (Moving Average Convergence Divergence)',
                    description: 'Trend-following momentum indicator',
                    category: 'momentum',
                    parameters: [
                        { name: 'fast', label: 'Fast Period', type: 'number', defaultValue: 12, min: 5, max: 50 },
                        { name: 'slow', label: 'Slow Period', type: 'number', defaultValue: 26, min: 10, max: 100 },
                        { name: 'signal', label: 'Signal Period', type: 'number', defaultValue: 9, min: 5, max: 50 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'bollingerBands',
                    displayName: 'Bollinger Bands',
                    description: 'Volatility indicator with upper and lower bands',
                    category: 'volatility',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 20, min: 5, max: 50 },
                        { name: 'stdDev', label: 'Standard Deviation', type: 'number', defaultValue: 2, min: 1, max: 3 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'atr',
                    displayName: 'Average True Range (ATR)',
                    description: 'Volatility indicator measuring market volatility',
                    category: 'volatility',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 14, min: 5, max: 50 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'adx',
                    displayName: 'Average Directional Index (ADX)',
                    description: 'Measures trend strength',
                    category: 'trend',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 14, min: 5, max: 50 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'stochastic',
                    displayName: 'Stochastic Oscillator',
                    description: 'Momentum indicator comparing closing price to price range',
                    category: 'momentum',
                    parameters: [
                        { name: 'kPeriod', label: 'K Period', type: 'number', defaultValue: 14, min: 5, max: 50 },
                        { name: 'dPeriod', label: 'D Period', type: 'number', defaultValue: 3, min: 1, max: 10 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'cci',
                    displayName: 'Commodity Channel Index (CCI)',
                    description: 'Identifies cyclical trends',
                    category: 'momentum',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 20, min: 5, max: 50 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'williamsR',
                    displayName: 'Williams %R',
                    description: 'Momentum indicator similar to Stochastic',
                    category: 'momentum',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 14, min: 5, max: 50 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'vwap',
                    displayName: 'Volume Weighted Average Price (VWAP)',
                    description: 'Average price weighted by volume',
                    category: 'volume',
                    parameters: [],
                    isVisibleToUsers: true
                },
                {
                    name: 'obv',
                    displayName: 'On-Balance Volume (OBV)',
                    description: 'Volume-based indicator showing buying/selling pressure',
                    category: 'volume',
                    parameters: [],
                    isVisibleToUsers: true
                },
                {
                    name: 'mfi',
                    displayName: 'Money Flow Index (MFI)',
                    description: 'Volume-weighted RSI',
                    category: 'volume',
                    parameters: [
                        { name: 'period', label: 'Period', type: 'number', defaultValue: 14, min: 5, max: 50 }
                    ],
                    isVisibleToUsers: true
                },
                {
                    name: 'psar',
                    displayName: 'Parabolic SAR',
                    description: 'Stop and Reverse indicator for trend direction',
                    category: 'trend',
                    parameters: [
                        { name: 'step', label: 'Step', type: 'number', defaultValue: 0.02, min: 0.01, max: 0.1 },
                        { name: 'max', label: 'Max', type: 'number', defaultValue: 0.2, min: 0.1, max: 0.5 }
                    ],
                    isVisibleToUsers: true
                }
            ];

            // Insert or update indicators
            for (const indicator of defaultIndicators) {
                await IndicatorTemplate.findOneAndUpdate(
                    { name: indicator.name },
                    indicator,
                    { upsert: true, new: true }
                );
            }

            logger.info('Indicators seeded successfully');
            return sendSuccess(res, { count: defaultIndicators.length }, 'Indicators seeded successfully', 201);
		} catch (error: unknown) {
            logger.error('Error seeding indicators:', error);
            return sendError(res, (error as Error).message || 'Failed to seed indicators', 500);
        }
    }

    /**
     * Update indicator parameters
     * PUT /api/indicators/admin/:indicatorId/parameters
     */
    static async updateIndicatorParameters(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { indicatorId } = req.params;
            const { parameters } = req.body;

            if (!parameters || !Array.isArray(parameters)) {
                return sendError(res, 'Invalid parameters', 400);
            }

            const indicator = await IndicatorTemplate.findById(indicatorId);
            if (!indicator) {
                return sendError(res, 'Indicator not found', 404);
            }

            indicator.parameters = parameters;
            await indicator.save();

            logger.info(`Admin ${userId} updated parameters for ${indicator.name}`);
            return sendSuccess(res, indicator, 'Indicator parameters updated successfully');
		} catch (error: unknown) {
            logger.error('Error updating indicator parameters:', error);
            return sendError(res, (error as Error)  .message || 'Failed to update parameters', 500);
        }
    }
}

