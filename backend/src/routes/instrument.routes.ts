import { Router } from 'express';
import { InstrumentController } from '../controllers/instrument.controller';

const router = Router();

/**
 * @route GET /api/instruments/search
 * @desc Search instruments by symbol/name
 * @access Public
 * @query q - Search query (required, min 2 chars)
 * @query limit - Number of results (default: 20, max: 50)
 * @query exchangeSegment - Filter by exchange segment (1: NSECM, 2: NSEFO, 3: NSECD, 11: BSECM, 12: BSEFO, 51: MCXFO)
 */
router.get('/search', InstrumentController.searchInstruments);

/**
 * @route GET /api/instruments/popular
 * @desc Get popular instruments
 * @access Public
 * @query limit - Number of results (default: 20, max: 50)
 */
router.get('/popular', InstrumentController.getPopularInstruments);

/**
 * @route GET /api/instruments/token/:token
 * @desc Get instrument by token
 * @access Public
 * @param token - Instrument token number
 */
router.get('/token/:token', InstrumentController.getInstrumentByToken);

/**
 * @route GET /api/instruments/exchange/:segment
 * @desc Get instruments by exchange segment
 * @access Public
 * @param segment - Exchange segment (1: NSE F&O, 2: NSE Cash, 3: MCX F&O)
 * @query limit - Number of results (default: 50, max: 100)
 */
router.get('/exchange/:segment', InstrumentController.getInstrumentsByExchange);

/**
 * @route GET /api/instruments/search-index
 * @desc Search index instruments
 * @access Public
 * @query q - Search query (required, min 2 chars)
 * @query limit - Number of results (default: 20, max: 50)
 */
router.get('/search-index', InstrumentController.searchIndexInstruments);

/**
 * @route GET /api/instruments/expiries
 * @desc Get available expiries for a symbol
 * @access Public
 * @query symbol - Symbol name (required, e.g., "NIFTY 50")
 */
router.get('/expiries', InstrumentController.getExpiriesForSymbol);

export default router;
