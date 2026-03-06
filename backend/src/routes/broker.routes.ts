import { Router } from 'express';
import { BrokerController } from '../controllers/broker.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All broker routes require authentication
router.use(protect);

/**
 * @route POST /api/broker/connect
 * @desc Connect to broker with credentials
 * @access Private
 */
router.post('/connect', BrokerController.connectBroker);

/**
 * @route GET /api/broker/status
 * @desc Get broker connection status
 * @access Private
 */
router.get('/status', BrokerController.getBrokerStatus);

/**
 * @route GET /api/broker/token
 * @desc Get broker token
 * @access Private
 */
router.get('/token', BrokerController.getBrokerToken);

/**
 * @route POST /api/broker/validate-token
 * @desc Validate broker token
 * @access Private
 */
router.post('/validate-token', BrokerController.validateBrokerToken);

/**
 * @route POST /api/broker/disconnect
 * @desc Disconnect broker
 * @access Private
 */
router.post('/disconnect', BrokerController.disconnectBroker);

/**
 * @route GET /api/broker/orderbook
 * @desc Get orderbook data
 * @access Private
 */
router.get('/orderbook', BrokerController.getOrderBook);

/**
 * @route GET /api/broker/positions
 * @desc Get positions data
 * @access Private
 */
router.get('/positions', BrokerController.getPositions);

/**
 * @route GET /api/broker/holdings
 * @desc Get holdings data
 * @access Private
 */
router.get('/holdings', BrokerController.getHoldings);

/**
 * @route GET /api/broker/tradebook
 * @desc Get tradebook data
 * @access Private
 */
router.get('/tradebook', BrokerController.getTradeBook);

/**
 * @route POST /api/broker/market-data-token
 * @desc Get market data token
 * @access Private
 */
router.post('/market-data-token', BrokerController.getMarketDataToken);

/**
 * @route POST /api/broker/market-data-quotes
 * @desc Get market data quotes
 * @access Private
 */
router.post('/market-data-quotes', BrokerController.getMarketDataQuotes);

export default router;