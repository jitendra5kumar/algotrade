import { Request, Response } from 'express';
import dealerApiService from '../services/dealer-api.service';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

class TradingController {
    /**
     * Place Order
     * POST /api/trading/order/place
     */
    public async placeOrder(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const {
                exchangeSegment,
                exchangeInstrumentID,
                productType,
                orderType,
                orderSide,
                orderQuantity,
                limitPrice,
                stopPrice,
                clientID,
            } = req.body;

            // Validate required fields
            if (!exchangeSegment || !exchangeInstrumentID || !productType || 
                !orderType || !orderSide || !orderQuantity || !clientID) {
                return sendError(res, 'Missing required fields', 400);
            }

            const orderParams = {
                exchangeSegment,
                exchangeInstrumentID: parseInt(exchangeInstrumentID),
                productType,
                orderType,
                orderSide,
                timeInForce: 'DAY',
                disclosedQuantity: 0,
                orderQuantity: orderQuantity.toString(),
                limitPrice: limitPrice || 0,
                orderUniqueIdentifier: Date.now().toString(),
                stopPrice: stopPrice || 0,
                clientID,
            };

            logger.info('Placing order:', { userId, orderParams });

            const result = await dealerApiService.placeOrder(orderParams);

            return sendSuccess(res, result, 'Order placed successfully');
		} catch (error: unknown) {
            logger.error('Error placing order:', error);
            return sendError(res, (error as Error).message || 'Failed to place order', 500);
        }
    }

    /**
     * Get Positions
     * GET /api/trading/positions
     */
    public async getPositions(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { clientID, dayOrNet } = req.query;

            if (!clientID) {
                return sendError(res, 'Client ID is required', 400);
            }

            logger.info('Fetching positions:', { userId, clientID });

            const result = await dealerApiService.getPositions(
                clientID as string,
                (dayOrNet as string) || 'NetWise'
            );

            return sendSuccess(res, result, 'Positions fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching positions:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch positions', 500);
        }
    }

    /**
     * Get TradeBook
     * GET /api/trading/tradebook
     */
    public async getTradeBook(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { clientID } = req.query;

            if (!clientID) {
                return sendError(res, 'Client ID is required', 400);
            }

            logger.info('Fetching tradebook:', { userId, clientID });

            const result = await dealerApiService.getTradeBook(clientID as string);

            return sendSuccess(res, result, 'Tradebook fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching tradebook:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch tradebook', 500);
        }
    }

    /**
     * Get OrderBook
     * GET /api/trading/orderbook
     */
    public async getOrderBook(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { clientID } = req.query;

            if (!clientID) {
                return sendError(res, 'Client ID is required', 400);
            }

            logger.info('Fetching orderbook:', { userId, clientID });

            const result = await dealerApiService.getOrderBook(clientID as string);

            return sendSuccess(res, result, 'Orderbook fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching orderbook:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch orderbook', 500);
        }
    }

    /**
     * Get Holdings
     * GET /api/trading/holdings
     */
    public async getHoldings(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { clientID } = req.query;

            if (!clientID) {
                return sendError(res, 'Client ID is required', 400);
            }

            logger.info('Fetching holdings:', { userId, clientID });

            const result = await dealerApiService.getHoldings(clientID as string);

            return sendSuccess(res, result, 'Holdings fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching holdings:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch holdings', 500);
        }
    }

    /**
     * Get Balance
     * GET /api/trading/balance
     */
    public async getBalance(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { clientID } = req.query;

            if (!clientID) {
                return sendError(res, 'Client ID is required', 400);
            }

            logger.info('Fetching balance:', { userId, clientID });

            const result = await dealerApiService.getBalance(clientID as string);

            return sendSuccess(res, result, 'Balance fetched successfully');
		} catch (error: unknown) {
            logger.error('Error fetching balance:', error);
            return sendError(res, (error as Error).message || 'Failed to fetch balance', 500);
        }
    }

    /**
     * Cancel Order
     * DELETE /api/trading/order/:appOrderID
     */
    public async cancelOrder(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const { appOrderID } = req.params;
            const { clientID } = req.query;

            if (!appOrderID || !clientID) {
                return sendError(res, 'Order ID and Client ID are required', 400);
            }

            logger.info('Cancelling order:', { userId, appOrderID, clientID });

            const result = await dealerApiService.cancelOrder(
                parseInt(appOrderID),
                clientID as string
            );

            return sendSuccess(res, result, 'Order cancelled successfully');
		} catch (error: unknown) {
            logger.error('Error cancelling order:', error);
            return sendError(res, (error as Error).message || 'Failed to cancel order', 500);
        }
    }

    /**
     * Square-Off Position
     * PUT /api/trading/squareoff
     */
    public async squareOff(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'Not authorized', 401);
            }

            const {
                exchangeSegment,
                exchangeInstrumentID,
                productType,
                squareoffMode,
                squareOffQtyValue,
                clientID,
            } = req.body;

            if (!exchangeSegment || !exchangeInstrumentID || !productType || 
                !squareoffMode || !squareOffQtyValue || !clientID) {
                return sendError(res, 'Missing required fields', 400);
            }

            const params = {
                exchangeSegment,
                exchangeInstrumentID: parseInt(exchangeInstrumentID),
                productType,
                squareoffMode,
                squareOffQtyValue: parseInt(squareOffQtyValue),
                clientID,
                positionSquareOffQuantityType: 'ExactQty',
            };

            logger.info('Square-off position:', { userId, params });

            const result = await dealerApiService.squareOff(params);

            return sendSuccess(res, result, 'Position squared-off successfully');
		} catch (error: unknown) {
            logger.error('Error square-off position:', error);
            return sendError(res, (error as Error).message || 'Failed to square-off position', 500);
        }
    }
}

export default new TradingController();

