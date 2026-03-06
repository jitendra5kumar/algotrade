import { Router } from 'express';
import { TokenManagerController } from '../controllers/token-manager.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All token management routes require authentication
router.use(protect);

/**
 * @route GET /api/tokens/status
 * @desc Get comprehensive token status for user
 * @access Private
 */
router.get('/status', TokenManagerController.getTokenStatus);

/**
 * @route GET /api/tokens/broker-details
 * @desc Get broker connection details
 * @access Private
 */
router.get('/broker-details', TokenManagerController.getBrokerDetails);

/**
 * @route POST /api/tokens/refresh-broker
 * @desc Refresh broker token
 * @access Private
 */
router.post('/refresh-broker', TokenManagerController.refreshBrokerToken);

/**
 * @route POST /api/tokens/refresh-market-data
 * @desc Refresh market data token
 * @access Private
 */
router.post('/refresh-market-data', TokenManagerController.refreshMarketDataToken);

/**
 * @route POST /api/tokens/clear
 * @desc Clear all tokens
 * @access Private
 */
router.post('/clear', TokenManagerController.clearAllTokens);

export default router;
