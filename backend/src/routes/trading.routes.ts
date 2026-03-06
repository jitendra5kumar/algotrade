import { Router } from 'express';
import tradingController from '../controllers/trading.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all trading routes
router.use(protect);

/**
| * @route   POST /api/trading/order/place
| * @desc    Place a new order
| * @access  Private
| */
router.post('/order/place', tradingController.placeOrder.bind(tradingController));

/**
| * @route   DELETE /api/trading/order/:appOrderID
| * @desc    Cancel an order
| * @access  Private
| */
router.delete('/order/:appOrderID', tradingController.cancelOrder.bind(tradingController));

/**
| * @route   GET /api/trading/positions
| * @desc    Get dealer positions
| * @access  Private
| */
router.get('/positions', tradingController.getPositions.bind(tradingController));

/**
| * @route   GET /api/trading/tradebook
| * @desc    Get dealer tradebook
| * @access  Private
| */
router.get('/tradebook', tradingController.getTradeBook.bind(tradingController));

/**
| * @route   GET /api/trading/orderbook
| * @desc    Get dealer orderbook
| * @access  Private
| */
router.get('/orderbook', tradingController.getOrderBook.bind(tradingController));

/**
| * @route   GET /api/trading/holdings
| * @desc    Get dealer holdings
| * @access  Private
| */
router.get('/holdings', tradingController.getHoldings.bind(tradingController));

/**
| * @route   GET /api/trading/balance
| * @desc    Get client balance
| * @access  Private
| */
router.get('/balance', tradingController.getBalance.bind(tradingController));

/**
| * @route   PUT /api/trading/squareoff
| * @desc    Square-off a position
| * @access  Private
| */
router.put('/squareoff', tradingController.squareOff.bind(tradingController));

export default router;

