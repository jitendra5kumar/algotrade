import { Request, Response } from 'express';
import tokenManagerService from '../services/token-manager.service';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

export class TokenManagerController {
    /**
     * Get comprehensive token status
     * GET /api/tokens/status
     */
    static async getTokenStatus(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'User not authenticated', 401);
            }

            const tokenStatus = await tokenManagerService.getTokenStatus(userId);
            
            return sendSuccess(res, {
                tokenStatus,
                summary: {
                    brokerConnected: tokenStatus.brokerToken.isActive,
                    marketDataConnected: tokenStatus.marketDataToken.isActive,
                    overallStatus: tokenStatus.brokerToken.isActive ? 'CONNECTED' : 'DISCONNECTED'
                }
            });
		} catch (error: unknown) {
            logger.error('Error getting token status:', error);
            return sendError(res, (error as Error).message || 'Failed to get token status', 500);
        }
    }

    /**
     * Refresh broker token
     * POST /api/tokens/refresh-broker
     */
    static async refreshBrokerToken(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'User not authenticated', 401);
            }

            const newToken = await tokenManagerService.refreshBrokerToken(userId);
            
            return sendSuccess(res, {
                token: newToken,
                message: 'Broker token refreshed successfully'
            });
		} catch (error: unknown) {
            logger.error('Error refreshing broker token:', error);
            return sendError(res, (error as Error).message || 'Failed to refresh broker token', 500);
        }
    }

    /**
     * Refresh market data token
     * POST /api/tokens/refresh-market-data
     */
    static async refreshMarketDataToken(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'User not authenticated', 401);
            }

            const newToken = await tokenManagerService.refreshMarketDataToken(userId);
            
            return sendSuccess(res, {
                token: newToken,
                message: 'Market data token refreshed successfully'
            });
		} catch (error: unknown) {
            logger.error('Error refreshing market data token:', error);
            return sendError(res, (error as Error).message || 'Failed to refresh market data token', 500);
        }
    }

    /**
     * Clear all tokens
     * POST /api/tokens/clear
     */
    static async clearAllTokens(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'User not authenticated', 401);
            }

            await tokenManagerService.clearAllTokens(userId);
            
            return sendSuccess(res, {
                message: 'All tokens cleared successfully'
            });
		} catch (error: unknown) {
            logger.error('Error clearing tokens:', error);
            return sendError(res, (error as Error).message || 'Failed to clear tokens', 500);
        }
    }

    /**
     * Get broker connection details
     * GET /api/tokens/broker-details
     */
    static async getBrokerDetails(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError(res, 'User not authenticated', 401);
            }

            const tokenStatus = await tokenManagerService.getTokenStatus(userId);
            
            return sendSuccess(res, {
                broker: {
                    isConnected: tokenStatus.brokerToken.isActive,
                    token: tokenStatus.brokerToken.token ? 'ACTIVE' : 'INACTIVE',
                    expiry: tokenStatus.brokerToken.expiry,
                    lastRefresh: tokenStatus.brokerToken.lastRefresh,
                    status: tokenStatus.brokerToken.isActive ? 'ACTIVE' : 'INACTIVE'
                },
                marketData: {
                    isConnected: tokenStatus.marketDataToken.isActive,
                    token: tokenStatus.marketDataToken.token ? 'ACTIVE' : 'INACTIVE',
                    expiry: tokenStatus.marketDataToken.expiry,
                    lastRefresh: tokenStatus.marketDataToken.lastRefresh,
                    status: tokenStatus.marketDataToken.isActive ? 'ACTIVE' : 'INACTIVE'
                }
            });
		} catch (error: unknown) {
            logger.error('Error getting broker details:', error);
            return sendError(res, (error as Error).message || 'Failed to get broker details', 500);
        }
    }
}
