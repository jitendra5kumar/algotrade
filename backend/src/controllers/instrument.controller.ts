import { Request, Response } from 'express';
import XtsInstrument from '../models/XtsInstrument.model';
import IndexInstrument from '../models/IndexInstrument.model';
import expirySelectorService from '../services/expiry-selector.service';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

export class InstrumentController {
    /**
     * Search instruments by symbol/name
     * GET /api/instruments/search?q=RELIANCE&limit=10
     */
    static async searchInstruments(req: Request, res: Response): Promise<Response> {
        try {
            const { q, limit = 20, exchangeSegment, strategyType } = req.query;

            if (!q || typeof q !== 'string' || q.trim().length < 2) {
                return sendError(res, 'Search query must be at least 2 characters long', 400);
            }

            const searchQuery = q.trim().toUpperCase();
            const limitNum = Math.min(parseInt(limit as string) || 20, 50); // Max 50 results

            // Build search criteria
            const searchCriteria: Record<string, unknown> = {
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                    { tradingSymbol: { $regex: searchQuery, $options: 'i' } }
                ]
            };

            // Add exchange segment filter if provided
            if (exchangeSegment) {
                const segmentNum = parseInt(exchangeSegment as string);
                if (!isNaN(segmentNum)) {
                    searchCriteria.exchangeSegment = segmentNum;
                }
            }

            // Add filter based on strategy type
            if (strategyType === 'stocks') {
                // For stocks, only show instruments where series is 'EQ'
                searchCriteria.series = 'EQ';
            } else if (strategyType === 'futures') {
                // For futures, only show instruments where description ends with 'FUT'
                searchCriteria.description = { $regex: 'FUT$', $options: 'i' };
            }

            // Search instruments
            const instruments = await XtsInstrument.find(searchCriteria)
                .select('name description instrumentToken exchangeSegment instrumentType lotSize tickSize expiry optionType strikePrice exchangeInstrumentID displayName' )
                .limit(limitNum)
                .sort({ name: 1 })
                .lean();

            // Transform data for frontend
            const transformedInstruments = instruments.map(instrument => ({
                id: instrument._id,
                instrumentToken: instrument.instrumentToken,
                exchangeInstrumentID: instrument.exchangeInstrumentID,
                name: instrument.name,
                description: instrument.description,
                exchangeSegment: instrument.exchangeSegment,
                instrumentType: instrument.instrumentType,
                lotSize: instrument.lotSize,
                tickSize: instrument.tickSize,
                expiry: instrument.expiry,
                optionType: instrument.optionType,
                strikePrice: instrument.strikePrice,
                displayName: instrument.displayName || `${instrument.name} (${instrument.description || 'N/A'})`,
                exchangeName: getExchangeName(instrument.exchangeSegment)
            }));

            logger.info(`Instrument search completed: "${searchQuery}" - ${transformedInstruments.length} results`);

            return sendSuccess(res, {
                instruments: transformedInstruments,
                total: transformedInstruments.length,
                query: searchQuery
            });

		} catch (error: unknown) {
            logger.error('Error searching instruments:', error);
            return sendError(res, 'Failed to search instruments', 500);
        }
    }

    /**
     * Get popular instruments (most searched/traded)
     * GET /api/instruments/popular
     */
    static async getPopularInstruments(req: Request, res: Response): Promise<Response> {
        try {
            const { limit = 20 } = req.query;
            const limitNum = Math.min(parseInt(limit as string) || 20, 50);

            // Popular NSE stocks (you can customize this list)
            const popularSymbols = [
                'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
                'ICICIBANK', 'KOTAKBANK', 'SBIN', 'BHARTIARTL', 'ITC',
                'LT', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'NESTLEIND',
                'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'BAJFINANCE'
            ];

            const instruments = await XtsInstrument.find({
                name: { $in: popularSymbols },
                exchangeSegment: 1 // NSECM (NSE Cash Market)
            })
            .select('name description instrumentToken exchangeSegment instrumentType lotSize tickSize exchangeInstrumentID')
            .limit(limitNum)
            .lean();

            const transformedInstruments = instruments.map(instrument => ({
                id: instrument._id,
                instrumentToken: instrument.instrumentToken,
                exchangeInstrumentID: instrument.exchangeInstrumentID,
                name: instrument.name,
                description: instrument.description,
                exchangeSegment: instrument.exchangeSegment,
                instrumentType: instrument.instrumentType,
                lotSize: instrument.lotSize,
                tickSize: instrument.tickSize,
                displayName: `${instrument.name} (${instrument.description || 'N/A'})`,
                exchangeName: getExchangeName(instrument.exchangeSegment)
            }));

            return sendSuccess(res, {
                instruments: transformedInstruments,
                total: transformedInstruments.length
            });

		} catch (error: unknown) {
            logger.error('Error fetching popular instruments:', error);
            return sendError(res, 'Failed to fetch popular instruments', 500);
        }
    }

    /**
     * Get instrument by token
     * GET /api/instruments/token/:token
     */
    static async getInstrumentByToken(req: Request, res: Response): Promise<Response> {
        try {
            const { token } = req.params;
            const tokenNum = parseInt(token);

            if (isNaN(tokenNum)) {
                return sendError(res, 'Invalid instrument token', 400);
            }

            // First, try to find in XtsInstrument collection
            let instrument = await XtsInstrument.findOne({ instrumentToken: tokenNum })
                .select('name description instrumentToken exchangeSegment instrumentType lotSize tickSize expiry optionType strikePrice exchangeInstrumentID displayName')
                .lean();

            // If not found in XtsInstrument, try to find in IndexInstrument collection
            if (!instrument) {
                const indexInstrument = await IndexInstrument.findOne({ exchangeInstrumentId: tokenNum })
                    .lean();

                if (indexInstrument) {
                    // Transform index instrument to match the expected format
                    const transformedInstrument = {
                        id: indexInstrument._id,
                        instrumentToken: indexInstrument.exchangeInstrumentId,
                        exchangeInstrumentID: indexInstrument.exchangeInstrumentId,
                        name: indexInstrument.name,
                        description: indexInstrument.name, // Use name as description for index instruments
                        exchangeSegment: 2, // NSECM for index instruments
                        instrumentType: 0, // Index type
                        lotSize: 1, // Default lot size for indices
                        tickSize: 0.05, // Default tick size
                        expiry: null,
                        optionType: null,
                        strikePrice: null,
                        displayName: indexInstrument.name,
                        exchangeName: 'NSE INDEX',
                        isIndex: true // Flag to identify as index instrument
                    };

                    return sendSuccess(res, { instrument: transformedInstrument });
                }

                return sendError(res, 'Instrument not found', 404);
            }

            // Transform XtsInstrument to expected format
            const transformedInstrument = {
                id: instrument._id,
                instrumentToken: instrument.instrumentToken,
                name: instrument.name,
                description: instrument.description,
                exchangeSegment: instrument.exchangeSegment,
                instrumentType: instrument.instrumentType,
                lotSize: instrument.lotSize,
                tickSize: instrument.tickSize,
                expiry: instrument.expiry,
                optionType: instrument.optionType,
                strikePrice: instrument.strikePrice,
                displayName: instrument.displayName || `${instrument.name} (${instrument.description || 'N/A'})`,
                exchangeName: getExchangeName(instrument.exchangeSegment)
            };

            return sendSuccess(res, { instrument: transformedInstrument });

		} catch (error: unknown) {
            logger.error('Error fetching instrument by token:', error);
            return sendError(res, 'Failed to fetch instrument', 500);
        }
    }

    /**
     * Get instruments by exchange segment
     * GET /api/instruments/exchange/:segment
     */
    static async getInstrumentsByExchange(req: Request, res: Response): Promise<Response> {
        try {
            const { segment } = req.params;
            const { limit = 50 } = req.query;
            
            const segmentNum = parseInt(segment);
            const limitNum = Math.min(parseInt(limit as string) || 50, 100);

            if (isNaN(segmentNum) || segmentNum < 1 || segmentNum > 3) {
                return sendError(res, 'Invalid exchange segment. Use 1 (NSE F&O), 2 (NSE Cash), or 3 (MCX F&O)', 400);
            }

            const instruments = await XtsInstrument.find({ exchangeSegment: segmentNum })
                .select('name description instrumentToken exchangeSegment instrumentType lotSize tickSize')
                .limit(limitNum)
                .sort({ name: 1 })
                .lean();

            const transformedInstruments = instruments.map(instrument => ({
                id: instrument._id,
                instrumentToken: instrument.instrumentToken,
                name: instrument.name,
                description: instrument.description,
                exchangeSegment: instrument.exchangeSegment,
                instrumentType: instrument.instrumentType,
                lotSize: instrument.lotSize,
                tickSize: instrument.tickSize,
                displayName: `${instrument.name} (${instrument.description || 'N/A'})`,
                exchangeName: getExchangeName(instrument.exchangeSegment)
            }));

            return sendSuccess(res, {
                instruments: transformedInstruments,
                total: transformedInstruments.length,
                exchangeSegment: segmentNum,
                exchangeName: getExchangeName(segmentNum)
            });

		} catch (error: unknown) {
            logger.error('Error fetching instruments by exchange:', error);
            return sendError(res, 'Failed to fetch instruments', 500);
        }
    }

    /**
     * Search index instruments
     * GET /api/instruments/search-index?q=NIFTY&limit=10
     */
    static async searchIndexInstruments(req: Request, res: Response): Promise<Response> {
        try {
            const { q, limit = 20 } = req.query;

            if (!q || typeof q !== 'string' || q.trim().length < 2) {
                return sendError(res, 'Search query must be at least 2 characters long', 400);
            }

            const searchQuery = q.trim().toUpperCase();
            const limitNum = Math.min(parseInt(limit as string) || 20, 50);

            // Search in index_instruments collection
            const indexInstruments = await IndexInstrument.find({
                name: { $regex: searchQuery, $options: 'i' }
            })
            .limit(limitNum)
            .sort({ name: 1 })
            .lean();

            // Transform data for frontend
            const transformedInstruments = indexInstruments.map((instrument) => ({
                id: instrument._id,
                instrumentToken: instrument.exchangeInstrumentId, // Use exchangeInstrumentID as token
                exchangeInstrumentID: instrument.exchangeInstrumentId,
                name: instrument.name,
                description: instrument.name, // Index name as description
                exchangeSegment: 1, // NSECM for indices
                displayName: instrument.name,
                exchangeName: 'NSE INDEX',
                isIndex: true, // Flag to identify as index
            }));

            logger.info(`Index instrument search completed: "${searchQuery}" - ${transformedInstruments.length} results`);

            return sendSuccess(res, {
                instruments: transformedInstruments,
                total: transformedInstruments.length,
                query: searchQuery
            });
        } catch (error: unknown) {
            logger.error('Error searching index instruments:', error);
            return sendError(res, 'Failed to search index instruments', 500);
        }
    }

    /**
     * Get available expiries for a symbol
     * GET /api/instruments/expiries?symbol=NIFTY 50
     */
    static async getExpiriesForSymbol(req: Request, res: Response): Promise<Response> {
        try {
            const { symbol } = req.query;

            if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
                return sendError(res, 'Symbol name is required', 400);
            }

            const symbolName = symbol.trim();
            const expiries = await expirySelectorService.getExpiriesForSymbol(symbolName);

            logger.info(`Fetched ${expiries.length} expiries for symbol: ${symbolName}`);

            return sendSuccess(res, {
                symbol: symbolName,
                expiries,
                count: expiries.length
            });
        } catch (error: unknown) {
            logger.error('Error fetching expiries:', error);
            return sendError(res, 'Failed to fetch expiries', 500);
        }
    }
}

/**
 * Helper function to get exchange name from segment number
 */
function getExchangeName(segment: number): string {
    switch (segment) {
        case 1:
            return 'NSE F&O';
        case 2:
            return 'NSE Cash';
        case 3:
            return 'MCX F&O';
        default:
            return 'Unknown';
    }
}
