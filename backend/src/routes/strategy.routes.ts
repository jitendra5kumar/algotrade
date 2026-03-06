import { Router } from 'express';
import strategyController from '../controllers/strategy.controller';
import { protect } from '../middleware/auth.middleware';
import strategyLogController from '../controllers/strategy-log.controller';

const router = Router();

// Apply authentication to all strategy routes
router.use(protect);

/**
| * @route   POST /api/strategies/simple
| * @desc    Create new strategy (simplified)
| * @access  Private
| */
router.post('/simple', strategyController.createSimpleStrategy.bind(strategyController));

/**
| * @route   GET /api/strategies/simple
| * @desc    Get all strategies for user (simplified)
| * @access  Private
| */
router.get('/simple', strategyController.getSimpleStrategies.bind(strategyController));

/**
| * @route   PUT /api/strategies/simple/:id
| * @desc    Update strategy (simplified)
| * @access  Private
| */
router.put('/simple/:id', strategyController.updateSimpleStrategy.bind(strategyController));

/**
| * @route   POST /api/strategies
| * @desc    Create new strategy
| * @access  Private
| */
router.post('/', strategyController.createStrategy.bind(strategyController));

/**
| * @route   GET /api/strategies
| * @desc    Get all strategies for user
| * @access  Private
| */
router.get('/', strategyController.getStrategies.bind(strategyController));

/**
| * @route   GET /api/strategies/monitors/active
| * @desc    Get all active monitors
| * @access  Private
| */
router.get('/monitors/active', strategyController.getActiveMonitors.bind(strategyController));

/**
| * @route   GET /api/strategies/templates
| * @desc    Get all visible strategy templates for users
| * @access  Private
| */
router.get('/templates', strategyController.getVisibleTemplates.bind(strategyController));

/**
| * @route   GET /api/strategies/templates/:id
| * @desc    Get strategy template details for user
| * @access  Private
| */
router.get('/templates/:id', strategyController.getTemplateDetailsForUser.bind(strategyController));

/**
| * @route   GET /api/strategies/:id
| * @desc    Get strategy by ID
| * @access  Private
| */
router.get('/:id', strategyController.getStrategyById.bind(strategyController));

/**
| * @route   PUT /api/strategies/:id
| * @desc    Update strategy
| * @access  Private
| */
router.put('/:id', strategyController.updateStrategy.bind(strategyController));

/**
| * @route   DELETE /api/strategies/:id
| * @desc    Delete strategy
| * @access  Private
| */
router.delete('/:id', strategyController.deleteStrategy.bind(strategyController));

/**
| * @route   POST /api/strategies/:id/start
| * @desc    Start strategy monitoring
| * @access  Private
| */
router.post('/:id/start', strategyController.startStrategy.bind(strategyController));

/**
| * @route   POST /api/strategies/:id/stop
| * @desc    Stop strategy monitoring
| * @access  Private
| */
router.post('/:id/stop', strategyController.stopStrategy.bind(strategyController));

/**
| * @route   POST /api/strategies/:id/pause
| * @desc    Pause strategy
| * @access  Private
| */
router.post('/:id/pause', strategyController.pauseStrategy.bind(strategyController));

/**
| * @route   POST /api/strategies/:id/resume
| * @desc    Resume paused strategy
| * @access  Private
| */
router.post('/:id/resume', strategyController.resumeStrategy.bind(strategyController));

/**
| * @route   POST /api/strategies/:id/close-position
| * @desc    Close open position manually
| * @access  Private
| */
router.post('/:id/close-position', strategyController.closePosition.bind(strategyController));

/**
| * @route   GET /api/strategies/:id/performance
| * @desc    Get strategy performance metrics
| * @access  Private
| */
router.get('/:id/performance', strategyController.getPerformance.bind(strategyController));

/**
| * @route   GET /api/strategies/:id/status
| * @desc    Get strategy monitor status
| * @access  Private
| */
router.get('/:id/status', strategyController.getMonitorStatus.bind(strategyController));

/**
 * @route   GET /api/strategies/:id/logs
 * @desc    Get strategy logs
 * @access  Private
 */
router.get('/:id/logs', strategyLogController.list.bind(strategyLogController));

/**
 * @route   DELETE /api/strategies/:id/logs/:logId
 * @desc    Delete a specific log
 * @access  Private
 */
router.delete('/:id/logs/:logId', strategyLogController.delete.bind(strategyLogController));

/**
 * @route   DELETE /api/strategies/:id/logs
 * @desc    Delete all logs for a strategy
 * @access  Private
 */
router.delete('/:id/logs', strategyLogController.deleteAll.bind(strategyLogController));

/**
 * @route   POST /api/strategies/:id/check
 * @desc    Check strategy execution (manual trigger)
 * @access  Private
 */
router.post('/:id/check', strategyController.checkStrategyExecution.bind(strategyController));

export default router;
