import { Request, Response } from 'express';
import marketDataService from '../services/market-data.service';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

export class MarketDataController {
    /**
     * Get market data token status
     * GET /api/market-data/token-status
     */
    static async getTokenStatus(_req: Request, res: Response): Promise<Response> {
        try {
            const tokenStatus = marketDataService.getTokenStatus();
            
            return sendSuccess(res, {
                tokenStatus,
                isActive: tokenStatus?.isActive || false,
                hasToken: !!tokenStatus?.token
            });
		} catch (error: unknown) {
            logger.error('Error getting token status:', error);
            return sendError(res, 'Failed to get token status', 500);
        }
    }

    /**
     * Get market data token
     * POST /api/market-data/token
     */
    static async getToken(_req: Request, res: Response): Promise<Response> {
        try {
            const token = await marketDataService.getMarketDataToken();
            const tokenStatus = marketDataService.getTokenStatus();
            
            return sendSuccess(res, {
                token: token,
                status: tokenStatus
            });
		} catch (error: unknown) {
            logger.error('Error getting market data token:', error);
            return sendError(res, (error as Error).message || 'Failed to get market data token', 500);
        }
    }

    /**
     * Get historical candle data
     * POST /api/market-data/historical
     */
    static async getHistoricalData(req: Request, res: Response): Promise<Response> {
        try {
            const {
                exchangeSegment,
                exchangeInstrumentID,
                startTime,
                endTime,
                compressionValue = 60 // Default 1 minute candles
            } = req.body;

            // Validation
            if (!exchangeSegment || !exchangeInstrumentID || !startTime || !endTime) {
                return sendError(res, 'Missing required fields: exchangeSegment, exchangeInstrumentID, startTime, endTime', 400);
            }

            const request = {
                exchangeSegment: parseInt(exchangeSegment),
                exchangeInstrumentID: parseInt(exchangeInstrumentID),
                startTime,
                endTime,
                compressionValue: parseInt(compressionValue)
            };

            const historicalData = await marketDataService.getHistoricalData(request);

            return sendSuccess(res, {
                data: historicalData,
                count: historicalData.length,
                request: request
            });
		} catch (error: unknown) {
            logger.error('Error fetching historical data:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch historical data', 500);
        }
    }

    /**
     * Get live quotes
     * POST /api/market-data/quotes
     */
    static async getLiveQuotes(req: Request, res: Response): Promise<Response> {
        try {
            const { instruments } = req.body;

            if (!instruments || !Array.isArray(instruments) || instruments.length === 0) {
                return sendError(res, 'Instruments array is required', 400);
            }

            // Validate and auto-correct instruments format
            const correctedInstruments = await Promise.all(instruments.map(async (inst) => {
                if (!inst.exchangeSegment || !inst.exchangeInstrumentID || inst.exchangeInstrumentID <= 0) {
                    return inst; // Invalid, will be caught by validation below
                }

                // Auto-correct exchangeSegment for index instruments
                // Check if instrument exists in IndexInstrument collection
                try {
                    const { default: IndexInstrument } = await import('../models/IndexInstrument.model');
                    const indexInstrument = await IndexInstrument.findOne({ 
                        exchangeInstrumentId: inst.exchangeInstrumentID 
                    }).lean();
                    
                    if (indexInstrument) {
                        // This is an index instrument, force NSECM (1) segment
                        logger.debug('Auto-correcting exchangeSegment for index instrument', {
                            instrumentId: inst.exchangeInstrumentID,
                            indexName: indexInstrument.name,
                            originalSegment: inst.exchangeSegment,
                            correctedSegment: 1,
                        });
                        return {
                            ...inst,
                            exchangeSegment: 1, // NSECM for indices
                        };
                    }
                } catch (error) {
                    // If IndexInstrument model not available, continue with original segment
                    logger.debug('Could not check IndexInstrument collection', { error: (error as Error).message });
                }

                return inst;
            }));

            // Validate instruments format after correction
            const validInstruments = correctedInstruments.every(inst => 
                inst.exchangeSegment && inst.exchangeInstrumentID && inst.exchangeInstrumentID > 0
            );

            if (!validInstruments) {
                logger.warn('Invalid instruments provided:', instruments);
                return sendError(res, 'Each instrument must have valid exchangeSegment and exchangeInstrumentID', 400);
            }

            const quotes = await marketDataService.getLiveQuotes(correctedInstruments);

            logger.info('Market data controller - quotes response:', {
                quotesCount: quotes.length,
                sampleQuote: quotes[0],
                instrumentsRequested: instruments
            });

            return sendSuccess(res, {
                quotes: quotes,
                count: quotes.length
            });
		} catch (error: unknown) {
            logger.error('Error fetching live quotes:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch live quotes', 500);
        }
    }

    /**
     * Test market data connection
     * GET /api/market-data/test-connection
     */
    static async testConnection(_req: Request, res: Response): Promise<Response> {
        try {
            const isConnected = await marketDataService.testConnection();
            
            return sendSuccess(res, {
                connected: isConnected,
                message: isConnected ? 'Market data connection successful' : 'Market data connection failed'
            });
		} catch (error: unknown) {
            logger.error('Error testing market data connection:', error);
            return sendError(res, (error as Error).message || 'Failed to test connection', 500);    
        }
    }

    /**
     * Refresh market data token
     * POST /api/market-data/refresh-token
     */
    static async refreshToken(_req: Request, res: Response): Promise<Response> {
        try {
            const token = await marketDataService.refreshToken();
            const tokenStatus = marketDataService.getTokenStatus();
            
            return sendSuccess(res, {
                token: token,
                status: tokenStatus,
                message: 'Token refreshed successfully'
            });
		} catch (error: unknown) {
            logger.error('Error refreshing market data token:', error);
            return sendError(res, (error as Error).message || 'Failed to refresh token', 500);
        }
    }
}
