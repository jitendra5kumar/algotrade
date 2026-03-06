    import { Router } from 'express';
import { MarketDataController } from '../controllers/market-data.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All market data routes require authentication
router.use(protect);

/**
 * @route GET /api/market-data/token-status
 * @desc Get market data token status
 * @access Private
 */
router.get('/token-status', MarketDataController.getTokenStatus);

/**
 * @route POST /api/market-data/token
 * @desc Get market data token
 * @access Private
 */
router.get('/token', MarketDataController.getToken);

/**
 * @route POST /api/market-data/historical
 * @desc Get historical candle data
 * @access Private
 */
router.post('/historical', MarketDataController.getHistoricalData);

/**
 * @route POST /api/market-data/quotes
 * @desc Get live quotes for instruments
 * @access Private
 */
router.post('/quotes', MarketDataController.getLiveQuotes);

/**
 * @route GET /api/market-data/test-connection
 * @desc Test market data connection
 * @access Private
 */
router.get('/test-connection', MarketDataController.testConnection);

/**
 * @route POST /api/market-data/refresh-token
 * @desc Refresh market data token
 * @access Private
 */
router.post('/refresh-token', MarketDataController.refreshToken);

export default router;
