import { Router } from 'express';
import tradeController from '../controllers/trade.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all trade routes
router.use(protect);

/**
 * @route   GET /api/trades/stats
 * @desc    Get trade statistics
 * @access  Private
 */
router.get('/stats', tradeController.getStatistics.bind(tradeController));

/**
 * @route   GET /api/trades/recent
 * @desc    Get recent trades
 * @access  Private
 */
router.get('/recent', tradeController.getRecentTrades.bind(tradeController));

/**
 * @route   GET /api/trades/open
 * @desc    Get open trades
 * @access  Private
 */
router.get('/open', tradeController.getOpenTrades.bind(tradeController));

/**
 * @route   GET /api/trades/export
 * @desc    Export trades to CSV
 * @access  Private
 */
router.get('/export', tradeController.exportTrades.bind(tradeController));

/**
 * @route   GET /api/trades
 * @desc    Get all trades with filters and pagination
 * @access  Private
 */
router.get('/', tradeController.getTrades.bind(tradeController));

/**
 * @route   GET /api/trades/:id
 * @desc    Get trade by ID
 * @access  Private
 */
router.get('/:id', tradeController.getTradeById.bind(tradeController));

export default router;

